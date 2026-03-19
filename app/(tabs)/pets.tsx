import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  Modal, Animated, RefreshControl,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize, Radius } from "@/lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import type { UserPet, Rarity } from "@/types";

const PULL_COST = 50;
const RARITY_COLOR: Record<Rarity, string> = {
  common: "#737373",
  rare: "#3b82f6",
  epic: "#8b5cf6",
  legendary: "#f59e0b",
};

const PET_ASSETS: Record<string, any> = {
  "pet-1.gif": require("../../assets/pets/pet-1.gif"),
  "pet-1-evolved.png": require("../../assets/pets/pet-1-evolved.png"),
  "pet-2.gif": require("../../assets/pets/pet-2.gif"),
  "pet-2-evolved.png": require("../../assets/pets/pet-2-evolved.png"),
  "pet-3.gif": require("../../assets/pets/pet-3.gif"),
  "pet-3-evolved.png": require("../../assets/pets/pet-3-evolved.png"),
  "pet-4.gif": require("../../assets/pets/pet-4.gif"),
  "pet-4-evolved.png": require("../../assets/pets/pet-4-evolved.png"),
  "pet-5.gif": require("../../assets/pets/pet-5.gif"),
  "pet-5-evolved.png": require("../../assets/pets/pet-5-evolved.png"),
  "pet-6.gif": require("../../assets/pets/pet-6.gif"),
  "pet-6-evolved.png": require("../../assets/pets/pet-6-evolved.png"),
};

function getPetSprite(spriteFile: string, level: number) {
  if (!spriteFile) return null;
  if (level >= 2) {
    const evolved = spriteFile.replace(".gif", "-evolved.png").replace(".png", "-evolved.png");
    if (PET_ASSETS[evolved]) return PET_ASSETS[evolved];
  }
  return PET_ASSETS[spriteFile] || null;
}

export default function PetsTab() {
  const c = useTheme();
  const { userId, xp, setXP } = useGameStore();
  const [pets, setPets] = useState<UserPet[]>([]);
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  async function loadPets() {
    const { data } = await supabase
      .from("user_pets")
      .select("*, pets(id, name, sprite_file, rarity, min_xp_to_evolve)")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false });
    setPets(data ?? []);
  }

  useEffect(() => { if (userId) loadPets(); }, [userId]);

  async function handlePull() {
    if (xp < PULL_COST) return;
    setPulling(true);

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      { iterations: 4 }
    ).start();

    // Direct Supabase logic (avoids Next.js cookie-auth issue)
    const { data: petsData } = await supabase.from("pets").select("*");
    spinAnim.setValue(0);
    setPulling(false);

    if (!petsData?.length) return;

    // Weighted random pick
    const roll = Math.random();
    let cumulative = 0;
    let chosen = petsData[0];
    for (const pet of petsData) {
      cumulative += (pet as any).drop_rate ?? 0.25;
      if (roll <= cumulative) { chosen = pet; break; }
    }

    // Deduct XP
    await supabase.from("users").update({ total_xp: xp - PULL_COST }).eq("id", userId!);
    await supabase.from("user_pets").insert({ user_id: userId, pet_id: (chosen as any).id, xp: 0, level: 1 });

    setXP(xp - PULL_COST);
    setPullResult(chosen);
    setModalVisible(true);
    await loadPets();
  }

  async function handleInteract(userPetId: string) {
    setWiggleId(userPetId);
    setTimeout(() => setWiggleId(null), 500);

    // Direct Supabase logic
    const { data: userPet } = await supabase
      .from("user_pets")
      .select("*, pets(min_xp_to_evolve)")
      .eq("id", userPetId)
      .eq("user_id", userId!)
      .single();

    if (!userPet) return;
    const PET_XP_PER_INTERACTION = 5;
    const newXP = userPet.xp + PET_XP_PER_INTERACTION;
    const pet = userPet.pets as any;
    const evolved = pet && newXP >= pet.min_xp_to_evolve && userPet.level === 1;
    const newLevel = evolved ? 2 : userPet.level;

    await supabase.from("user_pets").update({
      xp: evolved ? 0 : newXP,
      level: newLevel,
      last_interacted: new Date().toISOString(),
    }).eq("id", userPetId);

    setPets((prev) =>
      prev.map((p) => p.id === userPetId ? { ...p, xp: evolved ? 0 : newXP, level: newLevel } : p)
    );
  }

  const SLOT_ICONS = ["◆", "★", "●", "▲"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadPets(); setRefreshing(false); }} />}
      >
        <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.text }}>Pets</Text>

        {/* Gacha card */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: Radius.xl, borderWidth: 1, borderColor: c.border, padding: Spacing.xl }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg }}>
            <View>
              <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text }}>Gacha Pull</Text>
              <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 }}>8 unique pets to collect</Text>
            </View>
            <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, fontFamily: "monospace" }}>
              {xp} XP
            </Text>
          </View>

          {/* Slot display */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: Spacing.md, marginBottom: Spacing.lg }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{
                width: 48, height: 48, borderRadius: Radius.md,
                borderWidth: 1, borderColor: c.border,
                backgroundColor: c.bgSecondary,
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: 20, color: c.text }}>
                  {pulling ? SLOT_ICONS[(i + Math.floor(Date.now() / 100)) % 4] : "◈"}
                </Text>
              </View>
            ))}
          </View>

          <Button
            label={pulling ? "Pulling..." : `Pull (${PULL_COST} XP)`}
            onPress={handlePull}
            loading={pulling}
            disabled={xp < PULL_COST}
          />
          {xp < PULL_COST && (
            <Text style={{ color: c.textMuted, fontSize: FontSize.xs, textAlign: "center", marginTop: Spacing.sm }}>
              Need {PULL_COST - xp} more XP
            </Text>
          )}
        </View>

        {/* Collection */}
        <View>
          <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text, marginBottom: Spacing.md }}>
            Collection ({pets.length}) · Double-tap to interact
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
            {pets.map((up) => {
              const pet = up.pets;
              const isWiggling = wiggleId === up.id;
              const evolveProgress = Math.min(100, (up.xp / (pet.min_xp_to_evolve || 100)) * 100);
              const rarityColor = RARITY_COLOR[pet.rarity as Rarity];

              return (
                <TouchableOpacity
                  key={up.id}
                  onPress={() => handleInteract(up.id)}
                  activeOpacity={0.8}
                  style={{
                    width: "47%",
                    backgroundColor: c.bgCard,
                    borderRadius: Radius.lg,
                    borderWidth: 1.5,
                    borderColor: rarityColor + "44",
                    padding: Spacing.md,
                    alignItems: "center",
                    transform: [{ rotate: isWiggling ? "5deg" : "0deg" }],
                  }}
                >
                  {/* Sprite */}
                  {getPetSprite(pet.sprite_file, up.level) ? (
                    <Image
                      source={getPetSprite(pet.sprite_file, up.level)}
                      style={{ width: 64, height: 64, marginBottom: Spacing.sm }}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={{
                      width: 64, height: 64, borderRadius: Radius.md,
                      backgroundColor: c.bgSecondary,
                      alignItems: "center", justifyContent: "center",
                      marginBottom: Spacing.sm,
                    }}>
                      <Text style={{ fontSize: 32, color: rarityColor }}>
                        {pet.rarity === "legendary" ? "★" : pet.rarity === "epic" ? "◆" : pet.rarity === "rare" ? "▲" : "●"}
                      </Text>
                    </View>
                  )}

                  <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: c.text }}>{up.nickname ?? pet.name}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: rarityColor, marginTop: 2, textTransform: "capitalize" }}>
                    {pet.rarity} · Lv.{up.level}
                  </Text>

                  {up.level < 2 && (
                    <View style={{ width: "100%", height: 3, backgroundColor: c.bgSecondary, borderRadius: 2, marginTop: Spacing.sm, overflow: "hidden" }}>
                      <View style={{ width: `${evolveProgress}%`, height: "100%", backgroundColor: rarityColor, borderRadius: 2 }} />
                    </View>
                  )}
                  {up.level >= 2 && (
                    <Text style={{ fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.xs }}>Evolved ✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {pets.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: Spacing.xxl }}>
              <Text style={{ fontSize: 40, color: c.textMuted, marginBottom: Spacing.md }}>◈</Text>
              <Text style={{ color: c.textMuted, fontSize: FontSize.sm }}>No pets yet — do your first pull!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pull result modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#000000aa", alignItems: "center", justifyContent: "center", padding: Spacing.xl }}>
          <View style={{ backgroundColor: c.bgCard, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: "center", width: "100%" }}>
            <Text style={{ fontSize: FontSize.xs, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: Spacing.md }}>
              You got
            </Text>
            <View style={{
              width: 120, height: 120, borderRadius: Radius.xl,
              backgroundColor: c.bgSecondary, alignItems: "center", justifyContent: "center",
              marginBottom: Spacing.lg,
              borderWidth: 2,
              borderColor: pullResult ? RARITY_COLOR[pullResult.rarity as Rarity] : c.border,
              overflow: "hidden"
            }}>
              {pullResult?.sprite_file && getPetSprite(pullResult.sprite_file, 1) ? (
                <Image
                  source={getPetSprite(pullResult.sprite_file, 1)}
                  style={{ width: 96, height: 96 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ fontSize: 48, color: pullResult ? RARITY_COLOR[pullResult.rarity as Rarity] : c.text }}>
                  {pullResult?.rarity === "legendary" ? "★" : pullResult?.rarity === "epic" ? "◆" : "●"}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.text, marginBottom: 4 }}>
              {pullResult?.name}
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: pullResult ? RARITY_COLOR[pullResult.rarity as Rarity] : c.textMuted, textTransform: "capitalize", marginBottom: Spacing.xl }}>
              {pullResult?.rarity}
            </Text>
            <Button label="Sweet!" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
