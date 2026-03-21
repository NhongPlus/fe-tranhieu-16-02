import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Anchor,
  Stack,
  Text,
} from "@mantine/core";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

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
    <Paper w={420} p="xl" mx="auto" mt={120} radius="md" withBorder>
      <Stack>

        <Title order={2} ta="center">
          Register
        </Title>

        <TextInput
          label="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.currentTarget.value)}
        />

        <TextInput
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.currentTarget.value)}
        />

        <TextInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />

        <Button fullWidth mt="md" onClick={handleRegister}>
          Register
        </Button>

        <Text size="sm" ta="center">
          Đã có tài khoản?{" "}
          <Anchor component={Link} to="/login">
            Login
          </Anchor>
        </Text>

      </Stack>
    </Paper>
  );
}