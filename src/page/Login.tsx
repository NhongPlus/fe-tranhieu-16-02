import { useState } from "react";
import { TextInput, PasswordInput, Button, Paper, Title, Stack, Text, Anchor } from "@mantine/core";
import { useNavigate, Link } from "react-router-dom";
import { nprogress } from "@mantine/nprogress"; // Import nprogress
import { notifications } from "@mantine/notifications"; // Senior dùng cái này thay vì alert
import axios from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    nprogress.start();
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", {
        student_id: studentId,
        password: password,
      });

      // Backend trả về: { id, student_id, full_name }
      const userData = res.data;

      // Lưu thông tin user
      localStorage.setItem("user", JSON.stringify(userData));
      // Dùng access_token do backend trả về
      if (userData.access_token) {
        localStorage.setItem("token", userData.access_token);
      } else {
        // Fallback cũ (nếu backend chưa trả access_token)
        localStorage.setItem("token", userData.id);
      }

      nprogress.complete();
      notifications.show({
        title: "Thành công",
        message: `Chào mừng ${userData.full_name} trở lại!`,
        color: "teal",
      });

      // Redirect dứt điểm về dashboard
      navigate("/dashboard");
    } catch (err: any) {
      nprogress.complete();
      notifications.show({
        title: "Lỗi đăng nhập",
        message: err.response?.data?.message || "Mã SV hoặc mật khẩu không đúng",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper w={420} p="xl" mx="auto" mt={120} radius="md" shadow="md" withBorder>
      <Stack>
        <Title order={2} ta="center" fw={800} c="blue.7">
          STUDYMIND AI
        </Title>

        <TextInput
          label="Mã sinh viên"
          placeholder="Nhập mã sinh viên của bạn"
          value={studentId}
          onChange={(e) => setStudentId(e.currentTarget.value)}
          required
        />

        <PasswordInput
          label="Mật khẩu"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
        />

        <Button
          fullWidth
          mt="md"
          onClick={handleLogin}
          loading={loading} // Nút cũng sẽ quay quay đồng bộ với progress bar
        >
          Đăng nhập
        </Button>

        <Text size="sm" ta="center">
          Chưa có tài khoản?{" "}
          <Anchor component={Link} to="/register" fw={700}>
            Đăng ký ngay
          </Anchor>
        </Text>
      </Stack>
    </Paper>
  );
}