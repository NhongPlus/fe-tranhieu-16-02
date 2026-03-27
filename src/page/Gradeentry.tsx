import { useEffect, useState, memo, useMemo, type ReactNode } from "react";
import {
  Box,
  Stack,
  Group,
  Title,
  Text,
  Table,
  ScrollArea,
  NumberInput,
  TextInput,
  ActionIcon,
  Loader,
  Center,
  SegmentedControl,
  Tooltip,
  Select,
  Button,
  Grid,
  SimpleGrid,
  useMantineTheme,
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconTrash,
  IconStar,
  IconSearch,
  IconEdit,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconClockHour4,
  IconSchool,
  IconHome,
  IconChartBar,
  IconCalendarMonth,
  IconUser,
} from "@tabler/icons-react";
import API from "../api/axios";
import { notifications } from "@mantine/notifications";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import Navbar from "../components/Navbar";

// ─── Design tokens (StudyMind) ───────────────────────────────────────────────
const PRIMARY = "#a63300";
const TERTIARY = "#853d97";
const SECONDARY = "#565d5f";
const ON_SURFACE = "#2d2f2f";
const ON_VARIANT = "#5a5c5c";
const SURFACE = "#f6f6f6";
const SURFACE_LOW = "#f0f1f1";
const SURFACE_HIGH = "#e1e3e3";
const SURFACE_HIGHEST = "#dbdddd";
const OUTLINE_VARIANT = "rgba(172, 173, 173, 0.1)";

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
  grade_id: string;
}

interface PendingCourse {
  course_code: string;
  course_name: string;
  credits: number;
}

function letterPillStyle(letter: string | null): { bg: string; color: string } {
  if (!letter || letter === "—") return { bg: SURFACE_HIGH, color: "#767777" };
  if (letter === "A+") return { bg: "rgba(133, 61, 151, 0.1)", color: TERTIARY };
  if (["A", "A-"].includes(letter)) return { bg: "rgba(166, 51, 0, 0.1)", color: PRIMARY };
  if (["B+", "B", "B-"].includes(letter)) return { bg: "rgba(86, 93, 95, 0.1)", color: SECONDARY };
  return { bg: "rgba(166, 51, 0, 0.08)", color: PRIMARY };
}

function score10Color(course: Course): string {
  if (course.score_10 == null) return "#767777";
  if (course.score_letter === "A+") return TERTIARY;
  if (course.score_letter === "A" || course.score_letter === "A-") return PRIMARY;
  return ON_SURFACE;
}

// ─── GradeRow — isolated component ────────────────────────────────────────────
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
  const theme = useMantineTheme();
  const hasGrade = course.score_10 != null;
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      semester: course.semester ?? "",
      score_10: course.score_10 ?? undefined,
    },
  });

  const canInput = !hasGrade || isEditing;

  const handleSave = async () => {
    const semester = (form.values.semester?.trim() ?? "").replace(/\s+/g, " ");
    if (!semester) {
      notifications.show({ message: "Nhập học kỳ (vd: 2024.1)", color: "red" });
      return;
    }

    const scoreInput = form.values.score_10;
    if (scoreInput == null || scoreInput === "" || Number.isNaN(Number(scoreInput))) {
      notifications.show({ message: "Điểm phải là số hợp lệ từ 0 đến 10", color: "red" });
      return;
    }

    const score = Number(scoreInput);
    if (score < 0 || score > 10) {
      notifications.show({ message: "Điểm phải từ 0 đến 10", color: "red" });
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

  const pill = letterPillStyle(course.score_letter);
  const rowHover = { "&:hover": { background: "rgba(240, 241, 241, 0.5)" } };

  return (
    <Table.Tr style={rowHover}>
      <Table.Td px="lg" py="md">
        <Text size="sm" c={ON_VARIANT} fw={500}>
          {String(idx + 1).padStart(2, "0")}
        </Text>
      </Table.Td>

      <Table.Td px="lg" py="md">
        <Group gap={6} wrap="nowrap" align="flex-start">
          {isPriority && (
            <Tooltip label="Ưu tiên nhập" withArrow>
              <IconStar size={14} color={PRIMARY} fill={PRIMARY} style={{ flexShrink: 0, marginTop: 2 }} />
            </Tooltip>
          )}
          <Box>
            <Text fw={700} size="sm" c={ON_SURFACE}>
              {course.course_name}
            </Text>
            <Text fz={11} fw={500} c={ON_VARIANT} mt={2}>
              {course.course_code}
            </Text>
          </Box>
        </Group>
      </Table.Td>

      <Table.Td ta="center" px="lg" py="md">
        <Text size="sm" c={ON_SURFACE}>
          {course.credits}
        </Text>
      </Table.Td>

      <Table.Td ta="center" px="lg" py="md">
        <Text size="sm" fw={700} c={hasGrade ? score10Color(course) : ON_VARIANT}>
          {hasGrade ? course.score_10 : "—"}
        </Text>
      </Table.Td>

      <Table.Td ta="center" px="lg" py="md">
        <Text size="sm" c={ON_SURFACE}>
          {course.score_4 ?? "—"}
        </Text>
      </Table.Td>

      <Table.Td ta="center" px="lg" py="md">
        {course.score_letter ? (
          <Box
            component="span"
            px={8}
            py={4}
            style={{
              borderRadius: theme.radius.sm,
              fontWeight: 700,
              fontSize: 13,
              background: pill.bg,
              color: pill.color,
              display: "inline-block",
            }}
          >
            {course.score_letter}
          </Box>
        ) : (
          <Box
            component="span"
            px={8}
            py={4}
            style={{
              borderRadius: theme.radius.sm,
              fontWeight: 700,
              fontSize: 13,
              background: SURFACE_HIGH,
              color: "#767777",
              display: "inline-block",
            }}
          >
            —
          </Box>
        )}
      </Table.Td>

      <Table.Td px="lg" py="md">
        {canInput ? (
          <TextInput
            placeholder="2024.1"
            size="xs"
            styles={{
              input: {
                background: SURFACE_HIGHEST,
                border: course.score_10 === null && !isEditing ? "2px dashed rgba(172,173,173,0.3)" : undefined,
              },
            }}
            {...form.getInputProps("semester")}
          />
        ) : (
          <Text size="sm" c={ON_VARIANT}>
            {course.semester ?? "—"}
          </Text>
        )}
      </Table.Td>

      <Table.Td px="lg" py="md">
        {canInput ? (
          <NumberInput
            placeholder="0.0"
            size="xs"
            w={64}
            min={0}
            max={10}
            step={0.1}
            decimalScale={1}
            styles={{
              input: {
                background: SURFACE_HIGHEST,
                border: "none",
                textAlign: "center",
                fontWeight: 700,
                ...(course.score_10 === null && !isEditing
                  ? { border: "2px dashed rgba(172,173,173,0.3)" }
                  : {}),
              },
            }}
            {...form.getInputProps("score_10")}
          />
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>

      <Table.Td px="lg" py="md" style={{ textAlign: "right" }}>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          {canInput && (
            <Tooltip label="Lưu điểm" withArrow>
              <ActionIcon
                size="md"
                variant="subtle"
                color="gray"
                loading={saving}
                onClick={handleSave}
                styles={{
                  root: {
                    color: ON_VARIANT,
                  },
                }}
              >
                <IconDeviceFloppy size={20} />
              </ActionIcon>
            </Tooltip>
          )}

          {hasGrade && !isEditing && (
            <Tooltip label="Sửa điểm" withArrow>
              <ActionIcon size="md" variant="subtle" color="gray" onClick={() => setIsEditing(true)}>
                <IconEdit size={20} />
              </ActionIcon>
            </Tooltip>
          )}
          {hasGrade && isEditing && (
            <Tooltip label="Huỷ sửa" withArrow>
              <ActionIcon size="md" variant="subtle" color="gray" onClick={() => setIsEditing(false)}>
                <IconX size={20} />
              </ActionIcon>
            </Tooltip>
          )}

          {hasGrade && (
            <Tooltip label="Xoá điểm" withArrow>
              <ActionIcon
                size="md"
                variant="subtle"
                color="red"
                loading={deleting}
                onClick={handleDelete}
              >
                <IconTrash size={20} />
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
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const [courses, setCourses] = useState<Course[]>([]);
  const [pending, setPending] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState<string | null>(null);

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

  useEffect(() => {
    fetchAll();
  }, []);

  const pendingCodes = new Set(pending.map((p) => p.course_code));
  const studied = courses.filter((c) => c.score_10 != null);
  const notStudied = courses.filter((c) => c.score_10 == null);

  const semesters = Array.from(new Set(courses.map((c) => c.semester).filter(Boolean) as string[])).sort();

  const displayed = courses
    .filter((c) => {
      if (filter === "studied") return c.score_10 != null;
      if (filter === "not_studied") return c.score_10 == null;
      return true;
    })
    .filter((c) => !semesterFilter || c.semester === semesterFilter)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.course_name.toLowerCase().includes(q) || c.course_code.toLowerCase().includes(q);
    });

  const gpaWeighted = useMemo(() => {
    const graded = studied.filter((c) => c.score_4 != null && c.credits);
    if (graded.length === 0) return null;
    let pts = 0;
    let cr = 0;
    for (const c of graded) {
      pts += (c.score_4 ?? 0) * c.credits;
      cr += c.credits;
    }
    return cr > 0 ? pts / cr : null;
  }, [studied]);

  const shell = (
    <Box
      component="main"
      pb={isMobile ? 100 : 48}
      pt={96}
      px="md"
      style={{
        maxWidth: 1600,
        margin: "0 auto",
        minHeight: "100vh",
        background: SURFACE,
        color: ON_SURFACE,
      }}
    >
      <Grid gutter="xl" align="flex-start">
        {/* Left: priority */}
        <Grid.Col span={{ base: 12, lg: 3 }}>
          <Box
            p="lg"
            style={{
              background: SURFACE_LOW,
              borderRadius: theme.radius.md,
            }}
          >
            <Group gap={8} mb="lg">
              <IconAlertTriangle size={22} color={PRIMARY} />
              <Title order={3} size="h4" fw={700} c={ON_SURFACE}>
                Ưu tiên tín chỉ cao
              </Title>
            </Group>

            <Stack gap="md">
              {loading ? (
                <Center py="md">
                  <Loader size="sm" color="orange" />
                </Center>
              ) : pending.length === 0 ? (
                <Text size="sm" c={ON_VARIANT} ta="center" py="sm">
                  Không có môn ưu tiên
                </Text>
              ) : (
                pending.map((p, i) => {
                  const borderColor = i % 2 === 0 ? PRIMARY : TERTIARY;
                  const barColor = i % 2 === 0 ? PRIMARY : TERTIARY;
                  const progressPct = i === 0 ? 75 : i === 1 ? 0 : 40;
                  
                  return (
                    <Box
                      key={p.course_code}
                      p="md"
                      style={{
                        background: "#ffffff",
                        borderRadius: theme.radius.md,
                        boxShadow: "0 4px 20px -5px rgba(45, 47, 47, 0.05)",
                        borderLeft: `4px solid ${borderColor}`,
                        cursor: "default",
                        transition: "transform 0.15s ease",
                      }}
                    >
                     
                      <Text fw={700} c={ON_SURFACE}>
                        {p.course_name}
                      </Text>
                      <Text size="sm" c={ON_VARIANT} mt={4}>
                        Mã HP: {p.course_code}
                      </Text>
                    
                    </Box>
                  );
                })
              )}

              <Box
                p="md"
                mt="lg"
                style={{
                  background: "rgba(221, 228, 230, 0.5)",
                  borderRadius: theme.radius.md,
                }}
              >
                <Group gap="sm" align="flex-start" wrap="nowrap">
                  <IconInfoCircle size={20} color={SECONDARY} style={{ flexShrink: 0 }} />
                  <Text size="sm" c="#4c5355" style={{ lineHeight: 1.65 }}>
                    Các học phần ưu tiên nên hoàn tất nhập điểm đúng hạn để đảm bảo tiến độ xét học bổng và cập nhật GPA.
                  </Text>
                </Group>
              </Box>

              <Button variant="subtle" color="gray" size="xs" onClick={() => navigate(-1)}>
                ← Trở về
              </Button>
            </Stack>
          </Box>
        </Grid.Col>

        {/* Right: table */}
        <Grid.Col span={{ base: 12, lg: 9 }}>
          <Stack gap="xl">
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
              <Box>
                <Title order={1} fw={800} style={{ fontSize: "1.875rem", letterSpacing: "-0.025em", color: ON_SURFACE }}>
                  Nhập điểm học phần
                </Title>
                <Text size="sm" c={ON_VARIANT} mt={6}>
                  Quản lý và cập nhật kết quả học tập của sinh viên. — {studied.length}/{courses.length} môn đã nhập
                </Text>
              </Box>
              <Group gap="sm" wrap="wrap">
                <Select
                  placeholder="Lọc theo học kỳ"
                  size="sm"
                  clearable
                  data={semesters.map((s) => ({ value: s, label: s }))}
                  value={semesterFilter}
                  onChange={setSemesterFilter}
                  w={{ base: "100%", sm: 220 }}
                  styles={{
                    input: {
                      background: SURFACE_HIGH,
                      border: "none",
                      borderRadius: theme.radius.md,
                      fontWeight: 500,
                    },
                  }}
                  rightSection={<Text c="dimmed">▾</Text>}
                />
                <Button
                  size="sm"
                  radius="md"
                  fw={700}
                  leftSection={<IconDeviceFloppy size={18} />}
                  style={{
                    background: PRIMARY,
                    color: "#ffefeb",
                    boxShadow: "0 10px 15px -3px rgba(166, 51, 0, 0.2)",
                  }}
                  onClick={() =>
                    notifications.show({
                      message: "Vui lòng dùng nút lưu trên từng dòng để ghi điểm an toàn.",
                      color: "blue",
                    })
                  }
                >
                  Lưu tất cả
                </Button>
              </Group>
            </Group>

            <Group gap="sm" wrap="wrap">
              <TextInput
                placeholder="Tìm tên môn hoặc mã môn..."
                leftSection={<IconSearch size={16} />}
                size="sm"
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                style={{ flex: 1, minWidth: 200 }}
                styles={{
                  input: {
                    background: "#ffffff",
                    border: `1px solid ${OUTLINE_VARIANT}`,
                  },
                }}
              />
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

            <Box
              style={{
                background: "#ffffff",
                borderRadius: theme.radius.md,
                boxShadow: "0 10px 40px -15px rgba(45, 47, 47, 0.08)",
                overflow: "hidden",
              }}
            >
              {loading ? (
                <Center py={80}>
                  <Loader color="orange" />
                </Center>
              ) : (
                <ScrollArea type="scroll">
                  <Table horizontalSpacing={0} verticalSpacing={0} withTableBorder={false} style={{ minWidth: 900 }}>
                    <Table.Thead>
                      <Table.Tr style={{ background: SURFACE_LOW, borderBottom: `1px solid ${OUTLINE_VARIANT}` }}>
                        {["#", "Tên học phần", "TC", "Điểm 10", "Điểm 4", "Chữ", "Học kỳ", "Nhập điểm", "Thao tác"].map(
                          (h, i) => (
                            <Table.Th
                              key={h}
                              px="lg"
                              py={20}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: ON_VARIANT,
                                textAlign:
                                  i === 2 || i === 3 || i === 4 || i === 5 ? "center" : i === 8 ? "right" : "left",
                              }}
                            >
                              {h}
                            </Table.Th>
                          )
                        )}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {displayed.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={9} ta="center" py={48}>
                            <Text c={ON_VARIANT} size="sm">
                              Không có môn nào phù hợp
                            </Text>
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

              <Group
                justify="space-between"
                p="md"
                wrap="wrap"
                gap="md"
                style={{
                  background: SURFACE_LOW,
                  borderTop: `1px solid ${OUTLINE_VARIANT}`,
                }}
              >
                <Text size="sm" c={ON_VARIANT}>
                  Hiển thị {displayed.length === 0 ? "0" : `1 – ${displayed.length}`} của {courses.length} học phần
                  {search || semesterFilter || filter !== "all" ? " (sau lọc)" : ""}
                </Text>
                <Group gap={4}>
                  <ActionIcon variant="subtle" color="gray" disabled>
                    <IconChevronLeft size={20} />
                  </ActionIcon>
                  <Box
                    w={32}
                    h={32}
                    style={{
                      borderRadius: theme.radius.md,
                      background: PRIMARY,
                      color: "#ffefeb",
                      fontWeight: 700,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    1
                  </Box>
                  <ActionIcon variant="subtle" color="gray" disabled>
                    <IconChevronRight size={20} />
                  </ActionIcon>
                </Group>
              </Group>
            </Box>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              <Group
                p="lg"
                wrap="nowrap"
                align="center"
                gap="md"
                style={{ background: SURFACE_LOW, borderRadius: theme.radius.md }}
              >
                <Box
                  w={48}
                  h={48}
                  style={{
                    borderRadius: "50%",
                    background: "rgba(166, 51, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconCheck size={22} color={PRIMARY} />
                </Box>
                <Box>
                  <Text size="xs" fw={700} tt="uppercase" c={ON_VARIANT} style={{ letterSpacing: "0.06em" }}>
                    Đã nhập
                  </Text>
                  <Text fw={800} size="xl" c={ON_SURFACE}>
                    {String(studied.length).padStart(2, "0")} / {courses.length}
                  </Text>
                </Box>
              </Group>

              <Group
                p="lg"
                wrap="nowrap"
                align="center"
                gap="md"
                style={{ background: SURFACE_LOW, borderRadius: theme.radius.md }}
              >
                <Box
                  w={48}
                  h={48}
                  style={{
                    borderRadius: "50%",
                    background: "rgba(86, 93, 95, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconClockHour4 size={22} color={SECONDARY} />
                </Box>
                <Box>
                  <Text size="xs" fw={700} tt="uppercase" c={ON_VARIANT} style={{ letterSpacing: "0.06em" }}>
                    Chưa nhập
                  </Text>
                  <Text fw={800} size="xl" c={ON_SURFACE}>
                    {String(notStudied.length).padStart(2, "0")}
                  </Text>
                </Box>
              </Group>

              <Group
                p="lg"
                wrap="nowrap"
                align="center"
                gap="md"
                style={{
                  background: "rgba(255, 121, 73, 0.1)",
                  borderRadius: theme.radius.md,
                  border: "1px solid rgba(255, 121, 73, 0.2)",
                }}
              >
                <Box
                  w={48}
                  h={48}
                  style={{
                    borderRadius: "50%",
                    background: "rgba(166, 51, 0, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSchool size={22} color={PRIMARY} />
                </Box>
                <Box>
                  <Text size="xs" fw={700} tt="uppercase" c={PRIMARY} style={{ letterSpacing: "0.06em" }}>
                    GPA tạm tính
                  </Text>
                  <Text fw={800} size="xl" c={PRIMARY}>
                    {gpaWeighted != null ? gpaWeighted.toFixed(2) : "—"}
                  </Text>
                </Box>
              </Group>
            </SimpleGrid>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );

  return (
    <Box
      style={{
        background: SURFACE,
        minHeight: "100vh",
      }}
    >
      {shell}
      <Navbar />
      {/* Mobile bottom nav */}
      <Box
        hiddenFrom="md"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "8px 16px 16px",
          height: 80,
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(172, 173, 173, 0.15)",
          borderTopLeftRadius: theme.radius.lg,
          borderTopRightRadius: theme.radius.lg,
          boxShadow: "0 -10px 30px -5px rgba(45, 47, 47, 0.05)",
        }}
      >
        <BottomLink to="/dashboard" icon={<IconHome size={22} />} label="Home" active />
        <BottomLink to="/gpa" icon={<IconChartBar size={22} />} label="Grades" />
        <BottomLink to="/create-event" icon={<IconCalendarMonth size={22} />} label="Schedule" />
        <BottomLink to="/transcript" icon={<IconUser size={22} />} label="Profile" />
      </Box>
    </Box>
  );
}

function BottomLink({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        textDecoration: "none",
        padding: "4px 12px",
        borderRadius: 12,
        background: active ? "rgba(255, 121, 73, 0.1)" : undefined,
        color: active ? PRIMARY : SECONDARY,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
