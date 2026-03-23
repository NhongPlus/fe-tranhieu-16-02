import { useEffect, useState, memo, useRef } from "react";
import {
  Box, Stack, Group, Title, Text, Badge, Card,
  Table, ScrollArea, NumberInput, TextInput, ActionIcon,
  Loader, Center, SegmentedControl, Divider, Tooltip, Select,
  Button,
} from "@mantine/core";
import {
  IconDeviceFloppy, IconTrash, IconStar, IconSearch, IconEdit, IconX,
} from "@tabler/icons-react";
import API from "../api/axios";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Course {
  id: string | null;
  course_code: string;
  course_name: string;
  credits: number;
  score_10: number | null;
  score_4: number | null;
  score_letter: string | null;
  semester: string | null;
  grade_id: string
}

interface PendingCourse {
  course_code: string;
  course_name: string;
  credits: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scoreColor(letter: string | null) {
  if (!letter) return "gray";
  if (["A+", "A"].includes(letter)) return "teal";
  if (["B+", "B"].includes(letter)) return "blue";
  if (["C+", "C"].includes(letter)) return "yellow";
  if (["D+", "D"].includes(letter)) return "orange";
  return "red";
}

// ─── GradeRow — isolated component, tự quản lý state ────────────────────────
const GradeRow = memo(function GradeRow({
  course,
  idx,
  isPriority,
  onSaved,
  onDeleted,
}: {
  course: Course;
  idx: number;
  isPriority: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const hasGrade = course.score_10 !== null;
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Uncontrolled refs
  const scoreRef = useRef<HTMLInputElement>(null);
  const semesterRef = useRef<HTMLInputElement>(null);

  const canInput = !hasGrade || isEditing;

  const handleSave = async () => {
    const score = parseFloat(scoreRef.current?.value ?? "");
    const semester = semesterRef.current?.value?.trim() ?? "";

    if (isNaN(score) || score < 0 || score > 10) {
      notifications.show({ message: "Điểm phải từ 0 đến 10", color: "red" });
      return;
    }
    if (!semester) {
      notifications.show({ message: "Nhập học kỳ (vd: 2024.1)", color: "red" });
      return;
    }

    setSaving(true);
    try {
      if (course.grade_id) {
        await API.delete(`/gpa/grades/${course.grade_id}`);
      }
      await API.post("/gpa/grades", {
        course_code: course.course_code,
        score_10: score,
        semester,
      });
      notifications.show({ message: `Đã lưu: ${course.course_name}`, color: "teal" });
      setIsEditing(false);
      onSaved();
    } catch {
      notifications.show({ message: "Lỗi khi lưu điểm", color: "red" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!course.grade_id) return;
    setDeleting(true);
    try {
      await API.delete(`/gpa/grades/${course.grade_id}`);
      notifications.show({ message: `Đã xoá: ${course.course_name}`, color: "teal" });
      onDeleted();
    } catch {
      notifications.show({ message: "Lỗi khi xoá điểm", color: "red" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Table.Tr
      style={{
        backgroundColor: isPriority
          ? "var(--mantine-color-yellow-0)"
          : hasGrade
            ? "var(--mantine-color-teal-0)"
            : undefined,
      }}
    >
      {/* # */}
      <Table.Td>
        <Text size="xs" c="dimmed">{idx + 1}</Text>
      </Table.Td>

      {/* Tên môn */}
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          {isPriority && (
            <Tooltip label="Ưu tiên nhập" withArrow>
              <IconStar size={11}
                color="var(--mantine-color-yellow-5)"
                fill="var(--mantine-color-yellow-5)"
              />
            </Tooltip>
          )}
          <div>
            <Text size="sm" fw={hasGrade ? 600 : 400}>{course.course_name}</Text>
            <Text size="xs" c="dimmed">{course.course_code}</Text>
          </div>
        </Group>
      </Table.Td>

      {/* TC */}
      <Table.Td ta="center">
        <Text size="sm">{course.credits}</Text>
      </Table.Td>

      {/* Điểm 10 */}
      <Table.Td ta="center">
        <Text size="sm" fw={hasGrade ? 600 : 400} c={hasGrade ? "dark" : "dimmed"}>
          {course.score_10 ?? "—"}
        </Text>
      </Table.Td>

      {/* Điểm 4 */}
      <Table.Td ta="center">
        <Text size="sm">{course.score_4 ?? "—"}</Text>
      </Table.Td>

      {/* Chữ */}
      <Table.Td ta="center">
        {course.score_letter ? (
          <Badge color={scoreColor(course.score_letter)} variant="filled" size="sm">
            {course.score_letter}
          </Badge>
        ) : (
          <Text c="dimmed" size="sm">—</Text>
        )}
      </Table.Td>

      {/* Học kỳ input */}
      <Table.Td>
        {canInput ? (
          <TextInput
            ref={semesterRef}
            placeholder="2024.1"
            size="xs"
            defaultValue={course.semester ?? ""}
          />
        ) : (
          <Text size="sm">{course.semester ?? "—"}</Text>
        )}
      </Table.Td>

      {/* Điểm nhập */}
      <Table.Td>
        {canInput ? (
          <NumberInput
            ref={scoreRef}
            placeholder="0–10"
            size="xs"
            min={0}
            max={10}
            step={0.1}
            decimalScale={1}
            defaultValue={course.score_10 ?? undefined}
          />
        ) : (
          <Text size="sm" c="dimmed">—</Text>
        )}
      </Table.Td>

      {/* Thao tác */}
      <Table.Td>
        <Group gap={4} justify="center">
          {/* Lưu */}
          {canInput && (
            <Tooltip label="Lưu điểm" withArrow>
              <ActionIcon size="sm" color="teal" variant="light"
                loading={saving} onClick={handleSave}
              >
                <IconDeviceFloppy size={14} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* Sửa / Huỷ */}
          {hasGrade && !isEditing && (
            <Tooltip label="Sửa điểm" withArrow>
              <ActionIcon size="sm" color="blue" variant="light"
                onClick={() => setIsEditing(true)}
              >
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {hasGrade && isEditing && (
            <Tooltip label="Huỷ sửa" withArrow>
              <ActionIcon size="sm" color="gray" variant="light"
                onClick={() => setIsEditing(false)}
              >
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* Xoá */}
          {hasGrade && (
            <Tooltip label="Xoá điểm" withArrow>
              <ActionIcon size="sm" color="red" variant="light"
                loading={deleting} onClick={handleDelete}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GradeEntry() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [pending, setPending] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [transcriptRes, pendingRes] = await Promise.all([
        API.get("/gpa/transcript"),
        API.get("/gpa/courses/pending?limit=10"),
      ]);
      setCourses(Array.isArray(transcriptRes.data.data) ? transcriptRes.data.data : []);
      setPending(Array.isArray(pendingRes.data.data) ? pendingRes.data.data : []);
    } catch {
      notifications.show({ message: "Không thể tải dữ liệu", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const pendingCodes = new Set(pending.map((p) => p.course_code));
  const studied = courses.filter((c) => c.score_10 !== null);
  const notStudied = courses.filter((c) => c.score_10 === null);

  const semesters = Array.from(
    new Set(courses.map((c) => c.semester).filter(Boolean) as string[])
  ).sort();

  const displayed = courses
    .filter((c) => {
      if (filter === "studied") return c.score_10 !== null;
      if (filter === "not_studied") return c.score_10 === null;
      return true;
    })
    .filter((c) => !semesterFilter || c.semester === semesterFilter)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.course_name.toLowerCase().includes(q) ||
        c.course_code.toLowerCase().includes(q)
      );
    });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box style={{ display: "flex", height: "calc(100vh - 80px)", gap: 16, overflow: "hidden", padding: 16 }}>

      {/* ═══ LEFT: PENDING + STATS ══════════════════════════════════════════ */}
      <Box style={{ width: 220, flexShrink: 0 }}>
        <ScrollArea h="100%" type="never" offsetScrollbars overscrollBehavior="none">
          <Button onClick={() => navigate(-1)}>
            Main
          </Button>
          <Stack gap="sm" pb="md">
            <Group gap={6}>
              <IconStar size={15} color="var(--mantine-color-yellow-6)" />
              <Text fw={700} size="sm">Ưu tiên nhập trước</Text>
            </Group>
            <Text size="xs" c="dimmed">Môn tín chỉ cao chưa có điểm</Text>
            <Divider />

            {loading ? (
              <Center py="md"><Loader size="sm" /></Center>
            ) : pending.length === 0 ? (
              <Text size="xs" c="dimmed" ta="center" py="sm">Không có môn ưu tiên</Text>
            ) : (
              <Stack gap="xs">
                {pending.map((p) => (
                  <Card key={p.course_code} withBorder radius="md" padding="xs"
                    style={{ borderColor: "var(--mantine-color-yellow-3)" }}
                  >
                    <Text size="xs" fw={600} lineClamp={2}>{p.course_name}</Text>
                    <Group justify="space-between" mt={4}>
                      <Text size="xs" c="dimmed">{p.course_code}</Text>
                      <Badge size="xs" color="yellow" variant="light">{p.credits} TC</Badge>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}

            <Divider />

            <Stack gap={6}>
              {[
                { label: "Tổng môn", value: courses.length },
                { label: "Đã nhập", value: studied.length, color: "teal" },
                { label: "Chưa nhập", value: notStudied.length, color: "orange" },
              ].map((s) => (
                <Group key={s.label} justify="space-between">
                  <Text size="xs" c="dimmed">{s.label}</Text>
                  <Text size="xs" fw={700} c={s.color ?? "dark"}>{s.value}</Text>
                </Group>
              ))}
            </Stack>
          </Stack>
        </ScrollArea>
      </Box>

      {/* ═══ MAIN ═══════════════════════════════════════════════════════════ */}
      <Box style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={4} fw={700}>Nhập điểm học phần</Title>
            <Text size="xs" c="dimmed">{studied.length}/{courses.length} môn đã nhập</Text>
          </div>
          <SegmentedControl
            size="xs"
            value={filter}
            onChange={setFilter}
            data={[
              { label: "Tất cả", value: "all" },
              { label: "Đã nhập", value: "studied" },
              { label: "Chưa nhập", value: "not_studied" },
            ]}
          />
        </Group>

        {/* Filters */}
        <Group gap="sm">
          <TextInput
            placeholder="Tìm tên môn hoặc mã môn..."
            leftSection={<IconSearch size={14} />}
            size="xs"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Lọc theo học kỳ"
            size="xs"
            clearable
            data={semesters.map((s) => ({ value: s, label: s }))}
            value={semesterFilter}
            onChange={setSemesterFilter}
            style={{ width: 160 }}
          />
        </Group>

        {/* Table */}
        {loading ? (
          <Center style={{ flex: 1 }}><Loader size="md" /></Center>
        ) : (
          <ScrollArea style={{ flex: 1 }}>
            <Table highlightOnHover withColumnBorders withTableBorder style={{ minWidth: 860 }}>
              <Table.Thead bg="gray.0" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}>#</Table.Th>
                  <Table.Th>Tên học phần</Table.Th>
                  <Table.Th style={{ width: 55 }} ta="center">TC</Table.Th>
                  <Table.Th style={{ width: 80 }} ta="center">Điểm 10</Table.Th>
                  <Table.Th style={{ width: 65 }} ta="center">Điểm 4</Table.Th>
                  <Table.Th style={{ width: 55 }} ta="center">Chữ</Table.Th>
                  <Table.Th style={{ width: 120 }}>Học kỳ</Table.Th>
                  <Table.Th style={{ width: 110 }}>Nhập điểm</Table.Th>
                  <Table.Th style={{ width: 100 }} ta="center">Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {displayed.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={9} ta="center" py="xl">
                      <Text c="dimmed" size="sm">Không có môn nào phù hợp</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  displayed.map((course, idx) => (
                    <GradeRow
                      key={course.course_code}
                      course={course}
                      idx={idx}
                      isPriority={pendingCodes.has(course.course_code)}
                      onSaved={fetchAll}
                      onDeleted={fetchAll}
                    />
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {/* Legend */}
        <Group gap="md" pt={4}>
          {[
            { color: "var(--mantine-color-teal-1)", label: `Đã nhập: ${studied.length} môn` },
            { color: "var(--mantine-color-yellow-1)", label: "Ưu tiên nhập trước" },
            { color: "transparent", label: `Chưa nhập: ${notStudied.length} môn` },
          ].map((s) => (
            <Group key={s.label} gap={6}>
              <Box style={{ width: 10, height: 10, borderRadius: 2, background: s.color, border: "1px solid var(--mantine-color-gray-3)" }} />
              <Text size="xs" c="dimmed">{s.label}</Text>
            </Group>
          ))}
        </Group>
      </Box>
    </Box>
  );
}