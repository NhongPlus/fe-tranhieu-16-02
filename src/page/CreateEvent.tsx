import { useState } from "react";
import {
    Table,
    TextInput,
    Select,
    NumberInput,
    Button,
    Group,
    ActionIcon,
    Title,
    ScrollArea,
    Paper,
    Container,
    Text,
    Stack,
    Tooltip,
    Divider,
    Box
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconTrash, IconPlus, IconDeviceFloppy, IconArrowLeft } from "@tabler/icons-react";
import API from "../api/axios";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";

interface EventRow {
    title: string;
    room: string;
    teacher: string;
    day_of_week: string;
    session: string;
    period_start: number;
    period_end: number;
    start_date: Date | null;
    end_date: Date | null;
}

const DEFAULT_ROW: EventRow = {
    title: "",
    room: "",
    teacher: "",
    day_of_week: "2",
    session: "morning",
    period_start: 1,
    period_end: 3,
    start_date: null,
    end_date: null,
};

export default function CreateEvent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<EventRow[]>([{ ...DEFAULT_ROW }]);

    const addRow = () => setRows([...rows, { ...DEFAULT_ROW }]);

    const deleteRow = (index: number) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        }
    };

    const updateRow = (index: number, field: keyof EventRow, value: any) => {
        const newRows = [...rows];
        (newRows[index] as any)[field] = value;

        // Logic thông minh: Nếu nhập Ngày bắt đầu mà Ngày kết thúc trống, 
        // có thể gợi ý hoặc tự điền (tùy nghiệp vụ, ở đây tạm để người dùng tự nhập)
        setRows(newRows);
    };

    const handleSubmit = async () => {
        const hasEmpty = rows.some(r => !r.title || !r.start_date || !r.end_date);

        if (hasEmpty) {
            notifications.show({
                title: "Thiếu thông tin",
                message: "Vui lòng kiểm tra lại Tên môn, Ngày bắt đầu và Ngày kết thúc",
                color: "red",
            });
            return;
        }

        setLoading(true);
        try {
            const formattedEvents = rows.map(row => ({
                ...row,
                start_date: row.start_date?.toISOString(),
                end_date: row.end_date?.toISOString(),
            }));

            await API.post("/events", { events: formattedEvents });

            notifications.show({
                title: "Thành công",
                message: `Đã lưu ${rows.length} lịch học vào hệ thống`,
                color: "teal",
                icon: <IconDeviceFloppy size={18} />,
            });

            navigate("/dashboard");
        } catch (err: any) {
            notifications.show({
                title: "Lỗi hệ thống",
                message: err.response?.data?.message || "Không thể kết nối đến server",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="xl" py="xl">
            {/* Header Area */}
            <Stack gap="xs" mb="xl">
                <Button
                    variant="subtle"
                    leftSection={<IconArrowLeft size={16} />}
                    w="fit-content"
                    onClick={() => navigate(-1)}
                    p={0}
                >
                    Quay lại
                </Button>
                <Group justify="space-between" align="flex-end">
                    <div>
                        <Title order={2} fw={800} c="blue.9">Nhập lịch học hàng loạt</Title>
                    </div>
                    <Button
                        color="teal"
                        size="md"
                        leftSection={<IconDeviceFloppy size={20} />}
                        onClick={handleSubmit}
                        loading={loading}
                    >
                        Lưu tất cả lịch học
                    </Button>
                </Group>
            </Stack>

            <Paper withBorder radius="md" shadow="sm" style={{ overflow: "hidden" }}>
                <ScrollArea h={440} offsetScrollbars>
                    <Table
                        verticalSpacing="sm"
                        horizontalSpacing="md"
                        highlightOnHover
                        striped
                        withTableBorder
                        withColumnBorders
                        style={{ minWidth: 1400 }}
                    >
                        <Table.Thead bg="gray.0" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <Table.Tr>
                                <Table.Th style={{ width: 250 }}>Tên môn học</Table.Th>
                                <Table.Th style={{ width: 120 }}>Phòng</Table.Th>
                                <Table.Th style={{ width: 180 }}>Giảng viên</Table.Th>
                                <Table.Th style={{ width: 130 }}>Thứ</Table.Th>
                                <Table.Th style={{ width: 120 }}>Ca học</Table.Th>
                                <Table.Th style={{ width: 80 }}>Tiết BD</Table.Th>
                                <Table.Th style={{ width: 80 }}>Tiết KT</Table.Th>
                                <Table.Th style={{ width: 160 }}>Ngày bắt đầu</Table.Th>
                                <Table.Th style={{ width: 160 }}>Ngày kết thúc</Table.Th>
                                <Table.Th style={{ width: 60 }}>Xóa</Table.Th>
                            </Table.Tr>
                        </Table.Thead>

                        <Table.Tbody>
                            {rows.map((row, index) => (
                                <Table.Tr key={index}>
                                    <Table.Td>
                                        <TextInput
                                            variant="unstyled"
                                            placeholder="VD: Cấu trúc dữ liệu..."
                                            value={row.title}
                                            onChange={(e) => updateRow(index, "title", e.currentTarget.value)}
                                            styles={{ input: { fontWeight: 500 } }}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <TextInput
                                            variant="unstyled"
                                            placeholder="Phòng"
                                            value={row.room}
                                            onChange={(e) => updateRow(index, "room", e.currentTarget.value)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <TextInput
                                            variant="unstyled"
                                            placeholder="Tên GV"
                                            value={row.teacher}
                                            onChange={(e) => updateRow(index, "teacher", e.currentTarget.value)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Select
                                            variant="unstyled"
                                            data={[
                                                { value: "2", label: "Thứ 2" },
                                                { value: "3", label: "Thứ 3" },
                                                { value: "4", label: "Thứ 4" },
                                                { value: "5", label: "Thứ 5" },
                                                { value: "6", label: "Thứ 6" },
                                                { value: "7", label: "Thứ 7" },
                                                { value: "CN", label: "Chủ Nhật" },
                                            ]}
                                            value={row.day_of_week}
                                            onChange={(v) => updateRow(index, "day_of_week", v)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Select
                                            variant="unstyled"
                                            data={[
                                                { value: "morning", label: "Sáng" },
                                                { value: "afternoon", label: "Chiều" },
                                                { value: "evening", label: "Tối" },
                                            ]}
                                            value={row.session}
                                            onChange={(v) => updateRow(index, "session", v)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <NumberInput
                                            variant="unstyled"
                                            min={1} max={12}
                                            value={row.period_start}
                                            hideControls
                                            onChange={(v) => updateRow(index, "period_start", v)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <NumberInput
                                            variant="unstyled"
                                            min={1} max={12}
                                            value={row.period_end}
                                            hideControls
                                            onChange={(v) => updateRow(index, "period_end", v)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <DateInput
                                            variant="unstyled"
                                            value={row.start_date}
                                            placeholder="Chọn ngày"
                                            onChange={(v) => updateRow(index, "start_date", v)}
                                            valueFormat="DD/MM/YYYY"
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <DateInput
                                            variant="unstyled"
                                            value={row.end_date}
                                            placeholder="Chọn ngày"
                                            onChange={(v) => updateRow(index, "end_date", v)}
                                            valueFormat="DD/MM/YYYY"
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Tooltip label="Xóa dòng này">
                                            <ActionIcon
                                                color="red.4"
                                                variant="subtle"
                                                onClick={() => deleteRow(index)}
                                                disabled={rows.length === 1}
                                            >
                                                <IconTrash size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>

                <Divider />

                <Box p="md" bg="gray.0">
                    <Button
                        leftSection={<IconPlus size={16} />}
                        variant="light"
                        onClick={addRow}
                        fullWidth
                    >
                        Thêm một môn học mới
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

// Giả lập Box component từ Mantine nếu bạn chưa import