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
  Button,
  useMantineTheme,
} from "@mantine/core";
import { IconArrowUp, IconRobot, IconPlus } from "@tabler/icons-react"; // Dùng icon mũi tên đi lên giống ChatGPT
import API from "../api/axios";

// ... (giữ nguyên interface Message và các logic handleSend cũ)

export default function ChatPanel() {
  const theme = useMantineTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [answerHistory, setAnswerHistory] = useState<string[]>([]); // Lưu history answer
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

    // Gộp history nếu có, chỉ khi gửi answer
    let mergedMessage = userMessage;
    if (answerHistory.length > 0) {
      mergedMessage = answerHistory.join("\n") + "\n" + userMessage;
    }

    try {
      const res = await API.post("/chat/", { message: mergedMessage });
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
        setAnswerHistory([]); // Reset history khi add_grade
      } else {
        // Nếu là answer thì lưu vào history
        if (res.data.action === "answer") {
          setAnswerHistory((prev) => [...prev, userMessage]);
        }
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
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const studentId = msg.data.student_id || user.student_id || null;
      if (!studentId) {
        setMessages((prev) => [...prev, { role: "bot", content: "Không có student_id, không thể lưu điểm." }]);
        return;
      }

      await API.post("/gpa/grades/confirm", {
        pending_id: msg.pending_id || msg.data.pending_id,
        student_id: studentId,
        ...msg.data,
        semester,
      });

      // Chạy ok thì set success flag và thông báo
      setMessages((prev) => prev.filter((_, i) => i !== msgIndex));
      setMessages((prev) => [...prev, { role: "bot", content: "Đã xác nhận điểm" }]);

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

  const chatGradient = `linear-gradient(135deg, ${theme.colors.orange?.[6] ?? "#a63300"} 0%, ${theme.colors.orange?.[5] ?? "#ff7949"} 100%)`;
  const messageShadow = "0 10px 30px -5px rgba(45, 47, 47, 0.05), 0 20px 60px -10px rgba(45, 47, 47, 0.03)";

  const suggestions = [
    "Tóm tắt bài giảng",
    "Lập kế hoạch học tập",
    "Giải đáp bài tập",
    "Xem lại lịch sử",
  ];

  const welcomeText =
    "Chào bạn! Tôi là StudyMind AI. Hôm nay tôi có thể giúp gì cho quá trình học tập của bạn? Bạn có thể yêu cầu tôi tóm tắt bài giảng, giải bài tập hoặc lên kế hoạch ôn tập cho kỳ thi sắp tới.";

  return (
    <Stack h="100%" gap={0} style={{ background: "transparent" }}>
      {/* Chat Content Area */}
      <Box style={{ flex: 1, overflow: "hidden", padding: "40px 32px 0 32px" }}>
        <ScrollArea h="100%" viewportRef={viewport}>
          <Stack gap={24} maw={860} mx="auto" align="stretch">
            {/* AI Welcome Message */}
            <Group
              style={{ maxWidth: "85%", alignSelf: "flex-start" }}
              gap={16}
              align="flex-start"
              wrap="nowrap"
            >
              <Avatar
                radius="xl"
                size={40}
                style={{ background: theme.colors.gray[1], flexShrink: 0 }}
              >
                <IconRobot size={18} />
              </Avatar>
              <Box style={{ flex: 1 }}>
                <Paper
                  radius="md"
                  p="md"
                  style={{
                    background: theme.colors.gray[0],
                    borderTopLeftRadius: 0,
                    boxShadow: messageShadow,
                  }}
                >
                  <Text style={{ lineHeight: 1.65 }}>{welcomeText}</Text>
                </Paper>
                <Text
                  size="xs"
                  style={{
                    marginTop: 8,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontWeight: 700,
                    color: theme.colors.gray[6],
                    opacity: 0.85,
                  }}
                >
                  Vừa xong
                </Text>
              </Box>
            </Group>

            {/* User/Bot Messages */}
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <Group
                  key={index}
                  gap={16}
                  align="flex-start"
                  wrap="nowrap"
                  style={{
                    maxWidth: "85%",
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    flexDirection: isUser ? "row-reverse" : "row",
                  }}
                >
                  {isUser ? (
                    <Avatar
                      size={40}
                      radius="xl"
                      style={{ flexShrink: 0 }}
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJADHdjDfbL01kR_0k0gfMUyryDPJQN1Y11OEq__fnGW3_QD62nzpfhpP5XqMIeg_hmvHsfVlYKzDfF-pfpD0kNOz0EGAsGZ2Sz9ednWmcmfyqNvMVn3vIkSVM1yF2jZ6bpV83zA_gyAcy7cX6ozjTSYCLC45vhWEuxosef2BRK1q6vTvyLpQ1XGJjga0G6bb06Hamc32tfnF_Px2dal8CML2W97aK1j5PPwykXpH9D4tnvApixCqQmp4yacleqlGhsdNL90OWGG4"
                    />
                  ) : (
                    <Avatar
                      radius="xl"
                      size={40}
                      style={{ background: theme.colors.gray[1], flexShrink: 0 }}
                    >
                      <IconRobot size={18} />
                    </Avatar>
                  )}

                  <Box style={{ flex: 1 }}>
                    <Paper
                      radius="md"
                      p="md"
                      style={{
                        background: isUser ? theme.colors.orange[5] : theme.colors.gray[0],
                        color: isUser ? theme.white : theme.black,
                        borderTopRightRadius: isUser ? 0 : undefined,
                        borderTopLeftRadius: !isUser ? 0 : undefined,
                        boxShadow: messageShadow,
                      }}
                    >
                      <Text style={{ lineHeight: 1.65 }}>{msg.content}</Text>
                      {msg.action === "get_grades" && renderDynamicTable(msg.data)}

                      {msg.action === "add_grade" && msg.data && (
                        <Card
                          withBorder
                          mt="sm"
                          p={4}
                          radius="xl"
                          style={{
                            background: theme.white,
                            borderColor: theme.colors.gray[3],
                            boxShadow: theme.shadows.xl,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            p="md"
                            style={{
                              background: theme.colors.gray[1],
                              borderRadius: `calc(${theme.radius.xl} - 4px)`,
                            }}
                          >
                            <Group justify="space-between" mb="lg">
                              <Text fw={800} size="lg" style={{ letterSpacing: "-0.01em" }}>
                                Xác nhận nhập điểm
                              </Text>
                              <Text fw={800} c="orange.7">
                                analytics
                              </Text>
                            </Group>

                            <Box
                              mb="lg"
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                gap: 12,
                              }}
                            >
                              <Paper
                                p="sm"
                                radius="lg"
                                shadow="xs"
                                style={{ gridColumn: "1 / -1", background: theme.white }}
                              >
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                                  Môn học
                                </Text>
                                <Text fw={700}>
                                  {(msg.data.course_code ?? "N/A") + " - " + (msg.data.course_name ?? "Không rõ tên môn")}
                                </Text>
                              </Paper>

                              <Paper p="sm" radius="lg" shadow="xs" style={{ background: theme.white }}>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                                  Điểm 10
                                </Text>
                                <Text fw={800} size="xl" c="orange.7">
                                  {msg.data.score_10 ?? "?"}
                                </Text>
                              </Paper>

                              <Paper p="sm" radius="lg" shadow="xs" style={{ background: theme.white }}>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                                  Tín chỉ (TC)
                                </Text>
                                <Text fw={700}>
                                  {msg.data.credits ?? msg.data.credit ?? "?"}
                                </Text>
                              </Paper>

                              <Paper
                                p="sm"
                                radius="xl"
                                shadow="xs"
                                style={{ gridColumn: "1 / -1", background: theme.white }}
                              >
                                <Select
                                  size="sm"
                                  label="Học kỳ"
                                  data={ALLOWED_SEMESTERS.map((s) => ({ value: s, label: s }))}
                                  value={gradeConfirmSemester[index] || msg.data.semester || ""}
                                  placeholder="Chọn học kỳ"
                                  onChange={(value) => {
                                    if (value) {
                                      setGradeConfirmSemester((prev) => ({ ...prev, [index]: value }));
                                    }
                                  }}
                                />
                              </Paper>
                            </Box>

                            <Group grow>
                              <Button
                                variant="light"
                                color="gray"
                                radius="xl"
                                size="md"
                                onClick={() => cancelGrade(index)}
                              >
                                Hủy
                              </Button>
                              <Button
                                radius="xl"
                                size="md"
                                onClick={() => confirmGrade(index)}
                                styles={{
                                  root: {
                                    background: `linear-gradient(135deg, ${theme.colors.orange[7]} 0%, ${theme.colors.orange[5]} 100%)`,
                                  },
                                }}
                              >
                                Xác nhận
                              </Button>
                            </Group>
                          </Box>
                        </Card>
                      )}
                    </Paper>
                    <Text
                      size="xs"
                      style={{
                        marginTop: 8,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontWeight: 700,
                        color: theme.colors.gray[6],
                        opacity: 0.85,
                        textAlign: isUser ? "right" : "left",
                      }}
                    >
                      {isUser ? "1 phút trước" : "Đang xem"}
                    </Text>
                  </Box>
                </Group>
              );
            })}

            {loading && <Loader size="sm" variant="dots" color="gray" />}
          </Stack>
        </ScrollArea>
      </Box>

      {/* Footer Interaction Area */}
      <Box
        style={{
          padding: "22px 32px",
          borderTop: `1px solid ${theme.colors.gray[2]}`,
          background: theme.colors.gray[0],
        }}
      >
        <Stack gap={16} align="stretch">
          {/* Action Suggestion Chips */}
          <Group gap={10} style={{ flexWrap: "wrap" }}>
            {suggestions.map((s) => (
              <Button
                key={s}
                variant="light"
                radius="xl"
                color={theme.colors.orange?.[6] ? "orange" : undefined}
                style={{
                  background: "rgba(166,51,0,0.04)",
                  borderColor: "rgba(166,51,0,0.08)",
                  fontWeight: 700,
                }}
                onClick={() => setInput(s)}
              >
                {s}
              </Button>
            ))}
          </Group>

          {/* Input Field */}
          <Group
            style={{
              width: "100%",
              gap: 16,
              alignItems: "flex-end",
            }}
          >
            <Box style={{ flex: 1, position: "relative" }}>
              <Textarea
                variant="unstyled"
                placeholder="Nhập câu hỏi hoặc yêu cầu của bạn tại đây..."
                minRows={1}
                maxRows={6}
                autosize
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%",
                  padding: "14px 56px 14px 16px",
                  background: theme.colors.gray[1],
                  borderRadius: 12,
                  border: "1px solid transparent",
                }}
              />
            </Box>

            <ActionIcon
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size={56}
              radius="md"
              style={{
                background: chatGradient,
                color: theme.white,
                boxShadow: "0 10px 30px rgba(166,51,0,0.15)",
                transition: "transform 120ms ease",
              }}
            >
              <IconArrowUp size={20} stroke={3} />
            </ActionIcon>
          </Group>

          <Text
            size="xs"
            style={{
              textAlign: "center",
              marginTop: 4,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: theme.colors.gray[6],
              fontWeight: 600,
            }}
          >
            AI có thể đưa ra câu trả lời không chính xác. Hãy kiểm tra lại thông tin quan trọng.
          </Text>
        </Stack>
      </Box>
    </Stack>
  );
}