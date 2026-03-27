import { useState } from "react";
import type { CSSProperties } from "react";
import {
  Box,
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Stack,
  Text,
  Anchor,
  Group,
  Divider,
  ThemeIcon,
  Center,
} from "@mantine/core";
import { useNavigate, Link } from "react-router-dom";
import { nprogress } from "@mantine/nprogress";
import { notifications } from "@mantine/notifications";
import axios from "../api/axios";
import { IconChevronRight } from "@tabler/icons-react";

const styles: { [key: string]: CSSProperties } = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    background: "radial-gradient(circle at 10% 20%, rgba(255, 87, 34, 0.08), rgba(255, 255, 255, 1) 80%)",
  },
  left: {
    flex: 1,
    padding: "3rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(8px)",
  },
  right: {
    width: 580,
    borderLeft: "1px solid #e7eaee",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "2rem",
  },
  heroTitle: {
    fontSize: 48,
    lineHeight: 1.1,
    fontWeight: 800,
    marginBottom: "1rem",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
  },
};

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
        password,
      });

      const userData = res.data;
      localStorage.setItem("user", JSON.stringify(userData));
      if (userData.access_token) {
        localStorage.setItem("token", userData.access_token);
      } else {
        localStorage.setItem("token", userData.id);
      }

      notifications.show({
        title: "Thành công",
        message: `Chào mừng ${userData.full_name || "Sinh viên"} trở lại!`,
        color: "teal",
      });

      nprogress.complete();
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
    <Box style={styles.root}>
      <Box style={styles.left}>
        <Box mb="xl" pl={150} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left' }}>
          <Group gap="xs" mb="xs" >
            <ThemeIcon color="orange" radius="md" size="lg">
              S
            </ThemeIcon>
            <Text size="xl" fw={800} style={{ letterSpacing: 1 }}>
              STUDYMIND
            </Text>
          </Group>
          <Text size="xs" c="orange" fw={700} tt="uppercase" >
            Next-Gen Academic AI
          </Text>
          <Title style={styles.heroTitle} order={1}>
            Nâng tầm <Text style={styles.heroTitle} c={'#9D330A'}>Trí tuệ của bạn.</Text>
          </Title>
          <Group color="dimmed" mb="lg" style={{ maxWidth: 460 }}>
            Theo dõi lịch học tập và gpa của bạn , sản phẩm phát triển bởi Nguyễn Ngọc Bảo Long và Trần Minh Hiếu
            <Center style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFECE4" }}>
              <Text size="xs" color="#FF5722" fw={700}>AI</Text>
            </Center>
            <Text size="sm" color="dimmed">Trusted by students globally</Text>
          </Group>
        </Box>
      </Box>

      <Box style={styles.right}>
        <Paper style={styles.card} radius="lg" shadow="md" withBorder p="xl">
          <Stack gap="md">
            <Group align="center" mb="xs">
              <Title order={3}>Login</Title>
              <Text size="xs" color="dimmed">
                StudyMind AI portal
              </Text>
            </Group>
            <Divider />
            <TextInput
              label="Student ID"
              placeholder="STU-000-000"
              value={studentId}
              onChange={(e) => setStudentId(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
            <Button fullWidth onClick={handleLogin} loading={loading} radius="md" color="orange">
              Access Portal <IconChevronRight size={16} style={{ marginLeft: 8 }} />
            </Button>
            <Text size="xs" color="dimmed" ta="center">
              By continuing, you agree to StudyMind&apos;s{' '}
              <Anchor component="a" href="#" size="xs">
                Terms of intelligence
              </Anchor>
            </Text>
            <Text size="sm" ta="center">
              Chưa có tài khoản?{' '}
              <Anchor component={Link} to="/register" fw={700}>
                Đăng ký ngay
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
