import { useEffect, useState, type ReactNode } from "react";
import {
    Table,
    Loader,
    Center,
    Text,
    Stack,
    Title,
    Group,
    ScrollArea,
    Button,
    Box,
    Container,
    SimpleGrid,
    useMantineTheme,
} from "@mantine/core";
import { IconArrowLeft, IconSparkles } from "@tabler/icons-react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

interface Grade {
    id: string;
    course_name: string;
    course_code: string;
    credits: number;
    score_10: number | null;
    score_4: number | null;
    score_letter: string | null;
    semester: string;
    status: string;
    /** Mô tả môn (nếu API trả về) */
    description?: string | null;
}

const PRIMARY = "#a63300";
const SECONDARY_TEXT = "#565d5f";
const SURFACE = "#f6f6f6";
const SURFACE_LOW = "#f0f1f1";
const SURFACE_HIGH = "#e1e3e3";
const SURFACE_HIGHEST = "#dbdddd";

function letterBadgeStyle(letter: string | null): { bg: string; color: string } {
    if (!letter) return { bg: SURFACE_HIGH, color: SECONDARY_TEXT };
    if (["A+", "A"].includes(letter)) return { bg: "rgba(166, 51, 0, 0.1)", color: PRIMARY };
    if (["B+", "B", "B-"].includes(letter)) return { bg: "#dde4e6", color: "#4c5355" };
    if (["C+", "C", "C-"].includes(letter)) return { bg: SURFACE_HIGH, color: SECONDARY_TEXT };
    return { bg: "rgba(179, 27, 37, 0.08)", color: "#b31b25" };
}

export default function Transcript() {
    const theme = useMantineTheme();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandPending, setExpandPending] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTranscript = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await API.get("/gpa/transcript");
                const data = Array.isArray(res.data.data) ? res.data.data : [];
                setGrades(data);
            } catch {
                setError("Không thể tải bảng điểm. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchTranscript();
    }, []);

    const studied = grades.filter((g) => g.score_10 !== null);
    const notStudied = grades.filter((g) => g.score_10 === null);
    const totalCredits = studied.reduce((sum, g) => sum + (g.credits || 0), 0);

    const pendingPreview = 8;
    const visibleNotStudied = expandPending ? notStudied : notStudied.slice(0, pendingPreview);
    const hasMorePending = notStudied.length > pendingPreview;

    const shell = (children: ReactNode) => (
        <Box style={{ minHeight: "100vh", background: SURFACE, WebkitFontSmoothing: "antialiased" }}>
            {children}
        </Box>
    );

    if (loading) {
        return shell(
            <Center py="xl" style={{ minHeight: 320 }}>
                <Loader size="md" color="orange" />
            </Center>
        );
    }

    if (error) {
        return shell(
            <Container size="xl" pt={96} pb="xl">
                <Center py="xl">
                    <Text c="red" size="sm">
                        {error}
                    </Text>
                </Center>
            </Container>
        );
    }

    return shell(
        <>
            <Container size="xl" px="md" pt={96} pb={48} style={{ maxWidth: "80rem" }}>
                <Navbar />
                <Group justify="space-between" align="flex-end" gap="md" mb={40} wrap="wrap">
                    <Stack gap="sm">
                        <Title order={1} fw={800} style={{ fontSize: "2.25rem", letterSpacing: "-0.025em", color: "#2d2f2f" }}>
                            Bảng điểm học tập
                        </Title>
                        <Group gap="md" wrap="wrap">
                            <Box
                                component="span"
                                px={12}
                                py={4}
                                style={{
                                    background: SURFACE_HIGH,
                                    borderRadius: 9999,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: SECONDARY_TEXT,
                                }}
                            >
                                Tổng {grades.length} môn
                            </Box>
                            <Box
                                component="span"
                                px={12}
                                py={4}
                                style={{
                                    background: "rgba(166, 51, 0, 0.1)",
                                    borderRadius: 9999,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: PRIMARY,
                                }}
                            >
                                {studied.length} đã học ({totalCredits} tín chỉ)
                            </Box>
                            <Box
                                component="span"
                                px={12}
                                py={4}
                                style={{
                                    background: SURFACE_HIGH,
                                    borderRadius: 9999,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: SECONDARY_TEXT,
                                }}
                            >
                                {notStudied.length} chưa học
                            </Box>
                        </Group>
                    </Stack>
                    <Button
                        leftSection={<IconArrowLeft size={20} stroke={1.75} />}
                        variant="default"
                        radius="md"
                        size="md"
                        fw={600}
                        onClick={() => navigate(-1)}
                        styles={{
                            root: {
                                background: "#ffffff",
                                color: "#2d2f2f",
                                border: "1px solid rgba(172, 173, 173, 0.15)",
                                boxShadow: theme.shadows.sm,
                            },
                        }}
                    >
                        Trở về
                    </Button>
                </Group>

                <Stack gap={48}>
                    {/* Đã học */}
                    {studied.length > 0 && (
                        <Box component="section">
                            <Group gap={12} mb={24}>
                                <Box w={8} h={32} style={{ background: PRIMARY, borderRadius: 9999 }} />
                                <Title order={2} fw={700} size="h3" c="#2d2f2f">
                                    Đã học ({studied.length} môn)
                                </Title>
                            </Group>
                            <Box
                                style={{
                                    overflow: "hidden",
                                    borderRadius: theme.radius.md,
                                    background: "#ffffff",
                                    border: "1px solid rgba(172, 173, 173, 0.1)",
                                    boxShadow: theme.shadows.sm,
                                }}
                            >
                                <ScrollArea type="scroll">
                                    <Table
                                        horizontalSpacing="lg"
                                        verticalSpacing="md"
                                        withTableBorder={false}
                                        withColumnBorders={false}
                                        style={{ minWidth: 800 }}
                                    >
                                        <Table.Thead>
                                            <Table.Tr style={{ background: SURFACE_LOW }}>
                                                <Table.Th
                                                    py={16}
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        color: SECONDARY_TEXT,
                                                    }}
                                                >
                                                    STT
                                                </Table.Th>
                                                <Table.Th
                                                    py={16}
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        color: SECONDARY_TEXT,
                                                    }}
                                                >
                                                    Tên môn học
                                                </Table.Th>
                                                <Table.Th
                                                    ta="center"
                                                    py={16}
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        color: SECONDARY_TEXT,
                                                    }}
                                                >
                                                    Tín chỉ
                                                </Table.Th>
                                                <Table.Th
                                                    ta="center"
                                                    py={16}
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        color: SECONDARY_TEXT,
                                                    }}
                                                >
                                                    Điểm 10
                                                </Table.Th>
                                                <Table.Th
                                                    ta="center"
                                                    py={16}
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        color: SECONDARY_TEXT,
                                                    }}
                                                >
                                                    Điểm 4
                                                </Table.Th>
                                                <Table.Th
                                                    ta="center"
                                                    py={16}
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        color: SECONDARY_TEXT,
                                                    }}
                                                >
                                                    Chữ
                                                </Table.Th>
                                                <Table.Th
                                                    py={16}
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        color: SECONDARY_TEXT,
                                                    }}
                                                >
                                                    Học kỳ
                                                </Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {studied.map((item, index) => {
                                                const ls = letterBadgeStyle(item.score_letter);
                                                const isLast = index === studied.length - 1;
                                                return (
                                                    <Table.Tr
                                                        key={item.id || index}
                                                        style={{
                                                            borderBottom: isLast ? undefined : "1px solid rgba(172, 173, 173, 0.05)",
                                                            transition: "background 0.15s ease",
                                                        }}
                                                    >
                                                        <Table.Td py={20} style={{ fontWeight: 500 }}>
                                                            {String(index + 1).padStart(2, "0")}
                                                        </Table.Td>
                                                        <Table.Td py={20}>
                                                            <Text fw={700} size="md" c="#2d2f2f">
                                                                {item.course_name}
                                                            </Text>
                                                            <Text size="xs" c={SECONDARY_TEXT} mt={4}>
                                                                {item.course_code}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td ta="center" py={20} fw={600}>
                                                            {item.credits}
                                                        </Table.Td>
                                                        <Table.Td ta="center" py={20}>
                                                            <Text fw={700} c={PRIMARY}>
                                                                {item.score_10 ?? "—"}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td ta="center" py={20}>
                                                            {item.score_4 ?? "—"}
                                                        </Table.Td>
                                                        <Table.Td ta="center" py={20}>
                                                            {item.score_letter ? (
                                                                <Box
                                                                    component="span"
                                                                    px={12}
                                                                    py={6}
                                                                    style={{
                                                                        borderRadius: 8,
                                                                        fontWeight: 700,
                                                                        fontSize: 13,
                                                                        background: ls.bg,
                                                                        color: ls.color,
                                                                        display: "inline-block",
                                                                    }}
                                                                >
                                                                    {item.score_letter}
                                                                </Box>
                                                            ) : (
                                                                <Text c="dimmed" size="sm">
                                                                    —
                                                                </Text>
                                                            )}
                                                        </Table.Td>
                                                        <Table.Td py={20}>
                                                            <Text size="sm" c={SECONDARY_TEXT}>
                                                                {item.semester}
                                                            </Text>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                );
                                            })}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            </Box>
                        </Box>
                    )}

                    {/* Chưa học — dạng thẻ */}
                    {notStudied.length > 0 && (
                        <Box component="section">
                            <Group gap={12} mb={24}>
                                <Box w={8} h={32} style={{ background: SURFACE_HIGHEST, borderRadius: 9999 }} />
                                <Title order={2} fw={700} size="h3" c="#2d2f2f">
                                    Chưa học ({notStudied.length} môn)
                                </Title>
                            </Group>
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
                                {visibleNotStudied.map((item, index) => (
                                    <Box
                                        key={item.id || `${item.course_code}-${index}`}
                                        p="lg"
                                        style={{
                                            background: "#ffffff",
                                            borderRadius: theme.radius.md,
                                            border: "1px solid rgba(172, 173, 173, 0.1)",
                                            boxShadow: theme.shadows.sm,
                                            cursor: "default",
                                            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = "rgba(166, 51, 0, 0.3)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "rgba(172, 173, 173, 0.1)";
                                        }}
                                    >
                                        <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                                            <Text
                                                size="xs"
                                                fw={700}
                                                tt="uppercase"
                                                style={{ letterSpacing: "0.1em", color: SECONDARY_TEXT }}
                                            >
                                                Mã: {item.course_code}
                                            </Text>
                                            <Box
                                                px={8}
                                                py={4}
                                                style={{
                                                    background: SURFACE_HIGH,
                                                    borderRadius: 4,
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: SECONDARY_TEXT,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {item.credits} Tín chỉ
                                            </Box>
                                        </Group>
                                        <Text fw={700} size="md" c="#2d2f2f" mb={6} lineClamp={2}>
                                            {item.course_name}
                                        </Text>
                                        <Text size="sm" c={SECONDARY_TEXT} lineClamp={3} style={{ lineHeight: 1.5 }}>
                                            {item.description?.trim()
                                                ? item.description
                                                : "Môn học chưa có điểm — xem chi tiết trên trang nhập điểm khi đã hoàn thành."}
                                        </Text>
                                    </Box>
                                ))}
                            </SimpleGrid>
                            {hasMorePending && (
                                <Group justify="center" mt={32}>
                                    <Button
                                        variant="default"
                                        radius="md"
                                        size="md"
                                        fw={700}
                                        c={PRIMARY}
                                        onClick={() => setExpandPending((v) => !v)}
                                        styles={{
                                            root: {
                                                borderWidth: 2,
                                                borderColor: PRIMARY,
                                                background: "transparent",
                                            },
                                        }}
                                    >
                                        {expandPending
                                            ? "Thu gọn"
                                            : `Xem tất cả ${notStudied.length} môn chưa học`}
                                    </Button>
                                </Group>
                            )}
                        </Box>
                    )}

                    {grades.length === 0 && (
                        <Center py={48}>
                            <Text c={SECONDARY_TEXT} size="sm">
                                Chưa có dữ liệu bảng điểm.
                            </Text>
                        </Center>
                    )}
                </Stack>
            </Container>

            {/* FAB — trợ lý: về Dashboard (nơi có chat) */}
            <Box
                component="button"
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                    position: "fixed",
                    bottom: 32,
                    right: 32,
                    zIndex: 50,
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${PRIMARY} 0%, #ff7949 100%)`,
                    color: "#ffefeb",
                    boxShadow: theme.shadows.lg,
                    transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                }}
                aria-label="Mở trợ lý"
            >
                <IconSparkles size={28} stroke={1.5} />
            </Box>
        </>
    );
}
