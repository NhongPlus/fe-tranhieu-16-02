import { useEffect, useState } from "react";
import {
  Modal,
  Table,
  Loader,
  Center,
  Text,
  Badge,
  Stack,
  Group,
  Switch,
  TextInput,
  NumberInput,
  Select,
  Divider,
  Button,
  Card,
  Box,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconCalendar, IconBook, IconMapPin, IconUser } from "@tabler/icons-react";
import { getEvents } from "../api/event";
import API from "../api/axios";
import { notifications } from "@mantine/notifications";

function normalizeDayOfWeek(day: string) {
  const normalized = day
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  if (normalized === "cn" || normalized === "chủnhật" || normalized === "chu nhật") {
    return 7;
  }

  // Hỗ trợ các định dạng: "t3", "T3", "thứ3", "thu3"
  const dayNum = Number(normalized.replace(/[^0-9]/g, ""));
  if (Number.isInteger(dayNum) && dayNum >= 2 && dayNum <= 7) {
    return dayNum;
  }

  return 0;
}

function filterEventsThisWeek(events: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const currentDay = today.getDay() === 0 ? 7 : today.getDay();

  const filtered = events.filter((event) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return startDate <= nextWeek && endDate >= today;
  });

  return filtered.sort((a, b) => {
    const da = normalizeDayOfWeek(a.day_of_week);
    const db = normalizeDayOfWeek(b.day_of_week);

    const offsetA = (da - currentDay + 7) % 7;
    const offsetB = (db - currentDay + 7) % 7;

    if (offsetA !== offsetB) {
      return offsetA - offsetB;
    }

    const sa = new Date(a.start_date).getTime();
    const sb = new Date(b.start_date).getTime();
    if (sa !== sb) {
      return sa - sb;
    }

    return (a.period_start || 0) - (b.period_start || 0);
  });
}

type PanelMode = "skip" | "extra" | "edit" | null;

export default function ViewSchedule() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [submitting, setSubmitting] = useState(false);

  const [skipDate, setSkipDate] = useState<string | null>(null);
  const [hasMakeup, setHasMakeup] = useState(false);
  const [makeupDate, setMakeupDate] = useState<string | null>(null);
  const [makeupRoom, setMakeupRoom] = useState("");

  const [extraDate, setExtraDate] = useState<string | null>(null);
  const [extraRoom, setExtraRoom] = useState("");

  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getEvents();
        const allEvents = Array.isArray(response.data.data) ? response.data.data : [];
        setEvents(filterEventsThisWeek(allEvents));

        console.log("filterEventsThisWeek(allEvents)", filterEventsThisWeek(allEvents));
      } catch {
        setError("Không thể tải lịch học. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const openPanel = (event: any, mode: PanelMode) => {
    setSelectedEvent(event);
    setPanelMode(mode);
    setSkipDate(null);
    setHasMakeup(false);
    setMakeupDate(null);
    setMakeupRoom("");
    setExtraDate(null);
    setExtraRoom("");
    setEditData({
      title: event.title,
      room: event.room,
      teacher: event.teacher,
      day_of_week: event.day_of_week,
      session: event.session,
      period_start: event.period_start,
      period_end: event.period_end,
    });
  };

  const closePanel = () => {
    setPanelMode(null);
    setSelectedEvent(null);
  };

  const handleSkipSubmit = async () => {
    if (!skipDate) {
      notifications.show({ message: "Vui lòng chọn ngày nghỉ", color: "red" });
      return;
    }
    setSubmitting(true);
    try {
      await API.post(`/events/${selectedEvent.id}/skip`, { skip_date: skipDate });
      if (hasMakeup && makeupDate) {
        await API.post(`/events/${selectedEvent.id}/extra`, {
          extra_date: makeupDate,
          room: makeupRoom || selectedEvent.room,
        });
      }
      notifications.show({ message: "Đã lưu thông tin nghỉ bù", color: "teal" });
      closePanel();
    } catch {
      notifications.show({ message: "Lỗi khi lưu", color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtraSubmit = async () => {
    if (!extraDate) {
      notifications.show({ message: "Vui lòng chọn ngày học bù", color: "red" });
      return;
    }
    setSubmitting(true);
    try {
      await API.post(`/events/${selectedEvent.id}/extra`, {
        extra_date: extraDate,
        room: extraRoom || selectedEvent.room,
      });
      notifications.show({ message: "Đã thêm buổi học bù", color: "teal" });
      closePanel();
    } catch {
      notifications.show({ message: "Lỗi khi lưu", color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    setSubmitting(true);
    try {
      await API.patch(`/events/${selectedEvent.id}`, editData);
      notifications.show({ message: "Đã cập nhật lịch học", color: "teal" });
      closePanel();
      const response = await getEvents();
      setEvents(filterEventsThisWeek(Array.isArray(response.data) ? response.data : []));
    } catch {
      notifications.show({ message: "Lỗi khi cập nhật", color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  const panelTitle: Record<string, string> = {
    skip: "Nghỉ buổi học",
    extra: "Thêm buổi bù",
    edit: "Sửa thông tin lịch học",
  };

  const dayLabel = (d: string) => (d === "CN" ? "Chủ nhật" : `Thứ ${d}`);

  if (loading) {
    return <Center py="xl"><Loader size="sm" /></Center>;
  }

  if (error) {
    return <Text c="red" size="sm">{error}</Text>;
  }

  return (
    <>
      {events.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          Không có lịch học nào trong 7 ngày tới.
        </Text>
      ) : (
        <Stack gap="xs">
          {events.map((item, index) => (
            <Card
              key={item.id || index}
              withBorder
              radius="md"
              padding="sm"
              shadow="xs"
            >
              <Stack gap={6}>
                {/* Tên môn */}
                <Group gap={6}>
                  <IconBook size={14} color="var(--mantine-color-blue-6)" />
                  <Text fw={600} size="sm">{item.title}</Text>
                </Group>

                {/* Thông tin chi tiết */}
                <Group gap="md">
                  <Group gap={4}>
                    <IconMapPin size={13} color="var(--mantine-color-gray-5)" />
                    <Text size="xs" c="dimmed">{item.room}</Text>
                  </Group>
                  <Group gap={4}>
                    <IconCalendar size={13} color="var(--mantine-color-gray-5)" />
                    <Text size="xs" c="dimmed">
                      {dayLabel(item.day_of_week)} • Tiết {item.period_start}–{item.period_end}
                    </Text>
                  </Group>
                  {item.teacher && (
                    <Group gap={4}>
                      <IconUser size={13} color="var(--mantine-color-gray-5)" />
                      <Text size="xs" c="dimmed">{item.teacher}</Text>
                    </Group>
                  )}
                </Group>

                <Divider />

                {/* 3 nút hành động */}
                <Group gap={6}>
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    onClick={() => openPanel(item, "skip")}
                  >
                    Nghỉ
                  </Button>
                  <Button
                    size="xs"
                    color="teal"
                    variant="light"
                    onClick={() => openPanel(item, "extra")}
                  >
                    Bù
                  </Button>
                  <Button
                    size="xs"
                    color="gray"
                    variant="light"
                    onClick={() => openPanel(item, "edit")}
                  >
                    Sửa
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {/* PANEL HÀNH ĐỘNG */}
      <Modal
        opened={panelMode !== null}
        onClose={closePanel}
        title={panelMode ? panelTitle[panelMode] : ""}
        size="sm"
        centered
      >
        {selectedEvent && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Môn: <strong>{selectedEvent.title}</strong> — Phòng:{" "}
              <strong>{selectedEvent.room}</strong>
            </Text>
            <Divider />

            {panelMode === "skip" && (
              <Stack gap="md">
                <DateInput
                  label="Ngày nghỉ"
                  placeholder="Chọn ngày"
                  value={skipDate}
                  onChange={setSkipDate}
                  valueFormat="DD/MM/YYYY"
                  required
                />
                <Switch
                  label="Có học bù không?"
                  checked={hasMakeup}
                  onChange={(e) => setHasMakeup(e.currentTarget.checked)}
                />
                {hasMakeup && (
                  <>
                    <DateInput
                      label="Ngày học bù"
                      placeholder="Chọn ngày"
                      value={makeupDate}
                      onChange={setMakeupDate}
                      valueFormat="DD/MM/YYYY"
                    />
                    <TextInput
                      label="Phòng học bù (để trống nếu giữ nguyên)"
                      placeholder={selectedEvent.room}
                      value={makeupRoom}
                      onChange={(e) => setMakeupRoom(e.currentTarget.value)}
                    />
                  </>
                )}
                <Button loading={submitting} onClick={handleSkipSubmit} color="red">
                  Xác nhận nghỉ
                </Button>
              </Stack>
            )}

            {panelMode === "extra" && (
              <Stack gap="md">
                <DateInput
                  label="Ngày học bù"
                  placeholder="Chọn ngày"
                  value={extraDate}
                  onChange={setExtraDate}
                  valueFormat="DD/MM/YYYY"
                  required
                />
                <TextInput
                  label="Phòng học bù (để trống nếu giữ nguyên)"
                  placeholder={selectedEvent.room}
                  value={extraRoom}
                  onChange={(e) => setExtraRoom(e.currentTarget.value)}
                />
                <Button loading={submitting} onClick={handleExtraSubmit} color="teal">
                  Xác nhận thêm buổi
                </Button>
              </Stack>
            )}

            {panelMode === "edit" && (
              <Stack gap="md">
                <TextInput
                  label="Tên môn học"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.currentTarget.value })
                  }
                />
                <TextInput
                  label="Phòng"
                  value={editData.room}
                  onChange={(e) =>
                    setEditData({ ...editData, room: e.currentTarget.value })
                  }
                />
                <TextInput
                  label="Giảng viên"
                  value={editData.teacher}
                  onChange={(e) =>
                    setEditData({ ...editData, teacher: e.currentTarget.value })
                  }
                />
                <Select
                  label="Thứ"
                  data={[
                    { value: "2", label: "Thứ 2" },
                    { value: "3", label: "Thứ 3" },
                    { value: "4", label: "Thứ 4" },
                    { value: "5", label: "Thứ 5" },
                    { value: "6", label: "Thứ 6" },
                    { value: "7", label: "Thứ 7" },
                    { value: "CN", label: "Chủ Nhật" },
                  ]}
                  value={editData.day_of_week}
                  onChange={(v) => setEditData({ ...editData, day_of_week: v })}
                />
                <Group grow>
                  <NumberInput
                    label="Tiết bắt đầu"
                    min={1}
                    max={12}
                    value={editData.period_start}
                    onChange={(v) =>
                      setEditData({ ...editData, period_start: v })
                    }
                  />
                  <NumberInput
                    label="Tiết kết thúc"
                    min={1}
                    max={12}
                    value={editData.period_end}
                    onChange={(v) =>
                      setEditData({ ...editData, period_end: v })
                    }
                  />
                </Group>
                <Button loading={submitting} onClick={handleEditSubmit}>
                  Lưu thay đổi
                </Button>
              </Stack>
            )}
          </Stack>
        )}
      </Modal>
    </>
  );
}