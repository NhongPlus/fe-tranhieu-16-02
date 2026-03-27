import { type CSSProperties, useState } from "react";
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
import axios from "../api/axios";

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
    textAlign: "center",
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

export default function Register() {
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const res = await axios.post("/auth/register", {
      student_id: studentId,
      full_name: fullName,
      email,
      password,
    });

    localStorage.setItem("user", JSON.stringify(res.data));
    localStorage.setItem("token", "logged_in");

    navigate("/dashboard");
  };

  return (
    <Box style={styles.root}>
      <Box style={styles.left}>
        <Box mb="xl" pl={150} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left' }}>
          <Group gap="xs" mb="xs">
            <ThemeIcon color="orange" radius="md" size="lg">S</ThemeIcon>
            <Text size="xl" fw={800} style={{ letterSpacing: 1 }}>
              STUDYMIND
            </Text>
          </Group>
          <Text size="xs" color="orange" fw={700} tt="uppercase" mb="xs">
            Next-Gen Academic AI
          </Text>
          <Title style={styles.heroTitle} order={1}>
            Nâng tầm <Text style={styles.heroTitle} c={'#9D330A'}>Trí tuệ của bạn.</Text>
          </Title>
          <Text size="sm" color="dimmed" style={{ maxWidth: 460 }}>
            Theo dõi lịch học tập và gpa của bạn , sản phẩm phát triển bởi Nguyễn Ngọc Bảo Long và Trần Minh Hiếu
          </Text>
          <Group mt="md" align="center" justify="center" gap="xs">
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
              <Title order={3}>Register</Title>
              <Text size="xs" color="dimmed">StudyMind AI portal</Text>
            </Group>
            <Divider />
            <TextInput label="Student ID" value={studentId} onChange={(e) => setStudentId(e.currentTarget.value)} required />
            <TextInput label="Full Name" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} required />
            <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} required />
            <Button fullWidth onClick={handleRegister} radius="md" color="orange">
              Create account
            </Button>
            <Text size="xs" color="dimmed" ta="center">
              Chắc chắn bạn đã có tài khoản? <Anchor component={Link} to="/login" fw={700}>Đăng nhập</Anchor>
            </Text>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}