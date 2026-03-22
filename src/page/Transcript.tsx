import { useEffect, useState } from "react";
import {
    Table,
    Loader,
    Center,
    Text,
    Badge,
    Stack,
    Title,
    Card,
    Group,
    ScrollArea,
    Button,
} from "@mantine/core";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

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
}

function getScoreColor(letter: string | null) {
    if (!letter) return "gray";
    if (["A+", "A"].includes(letter)) return "teal";
    if (["B+", "B"].includes(letter)) return "blue";
    if (["C+", "C"].includes(letter)) return "yellow";
    if (["D+", "D"].includes(letter)) return "orange";
    return "red";
}

export default function Transcript() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    if (loading) {
        return (
            <Center py="xl">
                <Loader size="md" />
            </Center>
        );
    }

    if (error) {
        return (
            <Center py="xl">
                <Text c="red">{error}</Text>
            </Center>
        );
    }

    return (
        <Stack gap="lg" p="md">
             <Button onClick={() => { navigate(-1) }}>
                Trở về
            </Button>
            <div>
                <Title order={3} fw={700} c="blue.8">
                    Bảng điểm học tập
                </Title>
                <Text size="sm" c="dimmed">
                    Tổng {grades.length} môn — {studied.length} đã học ({totalCredits} tín chỉ) —{" "}
                    {notStudied.length} chưa học
                </Text>
            </div>
            {/* ĐÃ HỌC */}
            {studied.length > 0 && (
                <Card withBorder radius="md" padding={0} shadow="xs">
                    <Group px="md" py="sm" bg="blue.0">
                        <Text fw={600} size="sm" c="blue.8">
                            Đã học ({studied.length} môn)
                        </Text>
                    </Group>
                    <ScrollArea>
                        <Table highlightOnHover withColumnBorders style={{ minWidth: 640 }}>
                            <Table.Thead bg="gray.0">
                                <Table.Tr>
                                    <Table.Th style={{ width: 60 }}>STT</Table.Th>
                                    <Table.Th>Tên môn học</Table.Th>
                                    <Table.Th style={{ width: 100 }}>Mã môn</Table.Th>
                                    <Table.Th style={{ width: 80 }} ta="center">Tín chỉ</Table.Th>
                                    <Table.Th style={{ width: 100 }} ta="center">Điểm 10</Table.Th>
                                    <Table.Th style={{ width: 100 }} ta="center">Điểm 4</Table.Th>
                                    <Table.Th style={{ width: 80 }} ta="center">Chữ</Table.Th>
                                    <Table.Th style={{ width: 100 }} ta="center">Học kỳ</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {studied.map((item, index) => (
                                    <Table.Tr key={item.id || index}>
                                        <Table.Td c="dimmed" size="sm">{index + 1}</Table.Td>
                                        <Table.Td fw={500}>{item.course_name}</Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">{item.course_code}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">{item.credits}</Table.Td>
                                        <Table.Td ta="center">{item.score_10 ?? "—"}</Table.Td>
                                        <Table.Td ta="center">{item.score_4 ?? "—"}</Table.Td>
                                        <Table.Td ta="center">
                                            {item.score_letter ? (
                                                <Badge color={getScoreColor(item.score_letter)} variant="light" size="sm">
                                                    {item.score_letter}
                                                </Badge>
                                            ) : (
                                                <Text c="dimmed" size="sm">—</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Text size="xs">{item.semester}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Card>
            )}

            {/* CHƯA HỌC */}
            {notStudied.length > 0 && (
                <Card withBorder radius="md" padding={0} shadow="xs">
                    <Group px="md" py="sm" bg="gray.0">
                        <Text fw={600} size="sm" c="gray.7">
                            Chưa học ({notStudied.length} môn)
                        </Text>
                    </Group>
                    <ScrollArea>
                        <Table highlightOnHover withColumnBorders style={{ minWidth: 480 }}>
                            <Table.Thead bg="gray.0">
                                <Table.Tr>
                                    <Table.Th style={{ width: 60 }}>STT</Table.Th>
                                    <Table.Th>Tên môn học</Table.Th>
                                    <Table.Th style={{ width: 100 }}>Mã môn</Table.Th>
                                    <Table.Th style={{ width: 80 }} ta="center">Tín chỉ</Table.Th>
                                    <Table.Th style={{ width: 100 }} ta="center">Học kỳ</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {notStudied.map((item, index) => (
                                    <Table.Tr key={item.id || index}>
                                        <Table.Td c="dimmed" size="sm">{index + 1}</Table.Td>
                                        <Table.Td fw={500} c="dimmed">{item.course_name}</Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">{item.course_code}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center" c="dimmed">{item.credits}</Table.Td>
                                        <Table.Td ta="center">
                                            <Text size="xs" c="dimmed">{item.semester}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Card>
            )}

            {grades.length === 0 && !loading && (
                <Center py="xl">
                    <Text c="dimmed">Chưa có dữ liệu bảng điểm.</Text>
                </Center>
            )}
        </Stack>
    );
}