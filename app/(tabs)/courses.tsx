import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { useTheme, Spacing, FontSize } from "@/lib/theme";
import { Card, Pill } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CoursesTab() {
  const c = useTheme();
  const router = useRouter();
  const { userId } = useGameStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [{ data: allCourses }, { data: enrollments }] = await Promise.all([
      supabase.from("courses").select("*, users(name)").eq("published", true).order("created_at", { ascending: false }),
      supabase.from("enrollments").select("course_id").eq("user_id", userId!),
    ]);
    setCourses(allCourses ?? []);
    setEnrolledIds(new Set(enrollments?.map((e: any) => e.course_id) ?? []));
  }

  useEffect(() => { if (userId) load(); }, [userId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        <Text style={{ fontSize: FontSize.xl, fontWeight: "700", color: c.text }}>Courses</Text>

        {courses.length > 0 ? (
          <View style={{ gap: Spacing.md }}>
            {courses.map((course) => {
              const enrolled = enrolledIds.has(course.id);
              const teacher = course.users as { name: string } | null;
              return (
                <Card key={course.id} onPress={() => router.push(`/course/${course.id}`)}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                    <Pill label={course.subject || "General"} />
                    {enrolled && (
                      <View style={{ backgroundColor: c.text, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 999 }}>
                        <Text style={{ fontSize: FontSize.xs, color: c.accentFg, fontWeight: "600" }}>Enrolled</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: c.text, marginBottom: 4 }}>
                    {course.title}
                  </Text>
                  <Text style={{ fontSize: FontSize.sm, color: c.textSecondary, marginBottom: Spacing.sm }} numberOfLines={2}>
                    {course.description}
                  </Text>
                  <Text style={{ fontSize: FontSize.xs, color: c.textMuted }}>by {teacher?.name}</Text>
                </Card>
              );
            })}
          </View>
        ) : (
          <Card padding={Spacing.xxl}>
            <Text style={{ color: c.textMuted, textAlign: "center" }}>No published courses yet</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
