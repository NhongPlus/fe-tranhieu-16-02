import { useState, useRef } from "react";
import {
  Paper,
  Card,
  Textarea,
  ActionIcon,
  Stack,
  ScrollArea,
  Box,
  Text,
  Avatar,
  Group,
  Loader,
  Table,
  Select,
} from "@mantine/core";
import { IconArrowUp, IconRobot, IconPlus } from "@tabler/icons-react"; // Dùng icon mũi tên đi lên giống ChatGPT
import API from "../api/axios";

// ... (giữ nguyên interface Message và các logic handleSend cũ)

export default function ChatPanel() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  const normalizeGrades = (raw: any): any[] => {
    if (!raw) return [];

    let arrayData: any[] = [];
    if (Array.isArray(raw)) {
      arrayData = raw;
    } else if (raw.data && Array.isArray(raw.data)) {
      arrayData = raw.data;
    } else if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) arrayData = parsed;
        else if (parsed && Array.isArray(parsed.data)) arrayData = parsed.data;
      } catch {
        arrayData = [];
      }
    }

    const blacklist = new Set(["created_at", "creator_id", "start_date"]);
    return arrayData.map((item) => {
      if (!item || typeof item !== "object") return {};
      return Object.fromEntries(
        Object.entries(item).filter(([key]) => !blacklist.has(key))
      );
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await API.post("/chat/", { message: userMessage });
      const botContent = res.data.reply || res.data.response || "Không có phản hồi";

      if (res.data.action === "add_grade" && res.data.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: botContent,
            action: "add_grade",
            data: res.data.data,
            pending_id: res.data.data.pending_id || null,
          },
        ]);
      } else {
        const dataForTable = normalizeGrades(res.data.action === "get_grades" ? res.data.data : res.data);

        if (dataForTable.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: botContent,
              action: "get_grades",
              data: dataForTable,
            },
          ]);
        } else {
          setMessages((prev) => [...prev, { role: "bot", content: botContent }]);
        }
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "Lỗi kết nối..." }]);
    } finally {
      setLoading(false);
    }
  };


  // Hàm xử lý nhấn Enter (Enter để gửi, Shift+Enter để xuống dòng)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatUtc7 = (value: string): string => {
    if (typeof value !== "string" || !value.includes("T")) return value;

    const DATE_PART_REGEX =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?$/;

    return value
      .split(",")
      .map((raw) => raw.trim())
      .map((raw) => {
        if (!DATE_PART_REGEX.test(raw)) return raw;

        const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(raw);

        if (!hasTimezone) {
          // Không có timezone → coi là đã là giờ VN, chỉ reformat
          const [datePart, timePart] = raw.split("T");
          return `${datePart} ${timePart}`;
        }

        // Có timezone → convert sang UTC+7
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return raw;

        const utc7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        const y = utc7.getUTCFullYear();
        const m = String(utc7.getUTCMonth() + 1).padStart(2, "0");
        const d = String(utc7.getUTCDate()).padStart(2, "0");
        const hh = String(utc7.getUTCHours()).padStart(2, "0");
        const mm = String(utc7.getUTCMinutes()).padStart(2, "0");
        const ss = String(utc7.getUTCSeconds()).padStart(2, "0");
        return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
      })
      .join(", ");
  };

  const [gradeConfirmSemester, setGradeConfirmSemester] = useState<Record<number, string>>({});
  const ALLOWED_SEMESTERS = ["2024.1", "2024.2", "2025.1"];

  const confirmGrade = async (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg || !msg.data) return;

    const semester = gradeConfirmSemester[msgIndex] || msg.data.semester;
    if (!semester) {
      setMessages((prev) => [...prev, { role: "bot", content: "Vui lòng chọn học kỳ trước khi xác nhận." }]);
      return;
    }

    if (!ALLOWED_SEMESTERS.includes(semester)) {
      setMessages((prev) => [...prev, { role: "bot", content: `Học kỳ phải thuộc ${ALLOWED_SEMESTERS.join(", ")}` }]);
      return;
    }

    try {
      await API.post("/gpa/grades/confirm", {
        pending_id: msg.pending_id || msg.data.pending_id,
        ...msg.data,
        semester,
      });
      setMessages((prev) => prev.filter((_, i) => i !== msgIndex));
      setMessages((prev) => [...prev, { role: "bot", content: "Đã xác nhận điểm, đang cập nhật bảng..." }]);
      // Có thể gọi fetch lại bảng nếu cần từ ChatPanel trực tiếp.
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "Xác nhận thất bại, thử lại" }]);
    }
  };

  const cancelGrade = (msgIndex: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== msgIndex));
  };

  const renderDynamicTable = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      return <Text size="sm" c="dimmed">Không có dữ liệu bảng điểm</Text>;
    }

    const blacklist = new Set(["created_at", "creator_id", "start_date", "id"]);
    const columns = Array.from(
      new Set(data.flatMap((item) => Object.keys(item)))
    ).filter((key) => !blacklist.has(key));

    return (
      <Paper withBorder radius="md" mt="xs" p="sm" style={{ width: "100%", overflowX: "auto" }}>
        <Table
          striped
          highlightOnHover
          withColumnBorders
          verticalSpacing="xs"
          style={{ minWidth: 650 }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Stt</Table.Th>
              {columns.map((col) => (
                <Table.Th key={col}>{col}</Table.Th>  // ✅ Chỉ render tên cột
              ))}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data.map((item, idx) => (
              <Table.Tr key={item.id || `${idx}-${item.course_code || idx}`}>
                <Table.Td>{idx + 1}</Table.Td>
                {columns.map((col) => {
                  const value = item[col];
                  let display: string;

                  if (Array.isArray(value)) {
                    display = value
                      .map((v) => (typeof v === "string" ? formatUtc7(v) : String(v)))
                      .join(", ");
                  } else if (typeof value === "string") {
                    display = formatUtc7(value);  // ✅ Gọi formatUtc7
                  } else {
                    display = String(value ?? "");
                  }

                  return <Table.Td key={col}>{display}</Table.Td>;
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    );
  };

  return (
    <Stack h="90%" gap={0} bg="white">
      {/* Vùng nội dung chat (Giữ nguyên hoặc chỉnh padding) */}
      <ScrollArea h="500" viewportRef={viewport}>
        <Stack gap="xl" maw={800} mx="auto"> {/* Giới hạn độ rộng nội dung giống ChatGPT */}
          {messages.map((msg, index) => (
            <Group
              key={index}
              justify={msg.role === "user" ? "flex-end" : "flex-start"}
              align="flex-start"
              gap="md"
            >
              {msg.role === "bot" && (
                <Avatar src={null} alt="AI" color="teal" radius="xl" size="sm">
                  <IconRobot size={18} />
                </Avatar>
              )}
              <Box style={{ maxWidth: "85%" }}>
                <Text size="md" c={msg.role === "user" ? "dark.4" : "dark.9"} style={{
                  lineHeight: 1.6,
                  backgroundColor: msg.role === "user" ? "#f4f4f4" : "transparent",
                  padding: msg.role === "user" ? "8px 16px" : "0px",
                  borderRadius: "15px"
                }}>
                  {msg.content}
                </Text>
                {msg.action === "get_grades" && renderDynamicTable(msg.data)}
                {msg.action === "add_grade" && msg.data && (
                  <Card withBorder mt="sm" p="sm">
                    <Text size="sm" weight={600}>Xác nhận nhập điểm</Text>
                    <Text size="xs" mt="xs">Môn: {msg.data.course_name ?? msg.data.course_code}</Text>
                    <Text size="xs">Điểm 10: {msg.data.score_10}</Text>
                    <Text size="xs">TC: {msg.data.credits ?? msg.data.credit ?? "?"}</Text>

                    <Select
                      mt="xs"
                      size="xs"
                      label="Chọn học kỳ"
                      data={ALLOWED_SEMESTERS.map((s) => ({ value: s, label: s }))}
                      value={gradeConfirmSemester[index] || msg.data.semester || ""}
                      placeholder="Chọn học kỳ"
                      onChange={(value) => {
                        if (value) setGradeConfirmSemester((prev) => ({ ...prev, [index]: value }));
                      }}
                    />

                    <Group mt="xs" position="right" spacing="xs">
                      <Button size="xs" color="gray" onClick={() => cancelGrade(index)}>
                        Hủy
                      </Button>
                      <Button size="xs" color="green" onClick={() => confirmGrade(index)}>
                        Xác nhận
                      </Button>
                    </Group>
                  </Card>
                )}
              </Box>
            </Group>
          ))}
          {loading && <Loader size="xs" variant="dots" color="gray" />}
        </Stack>
      </ScrollArea>

      {/* VÙNG INPUT KIỂU CHATGPT */}
      <Box p="md" pb="xl">
        <Box maw={800} mx="auto" style={{ position: 'relative' }}>
          <Paper
            withBorder
            radius={26} // Bo tròn lớn
            shadow="sm"
            p="4px"
            style={{
              backgroundColor: "#f4f4f4", // Màu nền xám nhạt cực nhẹ
              border: "1px solid #e5e5e5",
              display: 'flex',
              alignItems: 'flex-end'
            }}
          >
            {/* Nút đính kèm bên trái */}
            <ActionIcon size={36} radius="xl" variant="subtle" color="gray" m="4px">
              <IconPlus size={20} />
            </ActionIcon>

            {/* Ô nhập liệu tự mở rộng chiều cao */}
            <Textarea
              variant="unstyled"
              placeholder="Message MindBot..."
              autosize
              minRows={1}
              maxRows={8}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1 }}
              styles={{
                input: {
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                }
              }}
            />

            {/* Nút gửi - Mũi tên lên trong hình tròn đen/xám */}
            <ActionIcon
              onClick={handleSend}
              size={32}
              radius="xl"
              color={input.trim() ? "dark" : "gray.4"} // Hiện màu đen khi có chữ
              variant="filled"
              m="6px"
              disabled={!input.trim() || loading}
            >
              <IconArrowUp size={18} stroke={3} />
            </ActionIcon>
          </Paper>

        </Box>
      </Box>
    </Stack>
  );
}