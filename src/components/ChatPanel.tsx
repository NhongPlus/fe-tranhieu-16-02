import { useState, useRef } from "react";
import {
  Paper,
  Textarea, // Thay TextInput bằng Textarea
  ActionIcon,
  Stack,
  ScrollArea,
  Box,
  Text,
  Avatar,
  Group,
  Loader,
} from "@mantine/core";
import { IconArrowUp, IconRobot, IconPlus } from "@tabler/icons-react"; // Dùng icon mũi tên đi lên giống ChatGPT
import API from "../api/axios";

// ... (giữ nguyên interface Message và các logic handleSend cũ)

export default function ChatPanel() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  // Logic gửi tin nhắn (giữ nguyên như trước)
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await API.post("/chat", { message: userMessage, student_id: "1671020113" });
      setMessages((prev) => [...prev, { role: "bot", content: res.data.response }]);
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

  return (
    <Stack h="100%" gap={0} bg="white">
      {/* Vùng nội dung chat (Giữ nguyên hoặc chỉnh padding) */}
      <ScrollArea h="calc(100vh - 180px)" viewportRef={viewport} p="xl">
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

          <Text size="xs" c="dimmed" ta="center" mt="xs">
            StudyMind AI can make mistakes. Check important info.
          </Text>
        </Box>
      </Box>
    </Stack>
  );
}