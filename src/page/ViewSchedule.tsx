import { useState } from "react";
import {
  Button,
  Modal,
  Table,
  Loader,
  Center,
  Text,
  ScrollArea,
  Badge,
  Stack,
  Group,
  Switch,
  TextInput,
  NumberInput,
  Select,
  Divider,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendar } from "@tabler/icons-react";
import { getEvents } from "../api/event";
import API from "../api/axios";
import { notifications } from "@mantine/notifications";

function filterEventsThisWeek(events: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  return events.filter((event) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return startDate <= nextWeek && endDate >= today;
  });
}

type PanelMode = "skip" | "extra" | "edit" | null;

export default function ViewSchedule() {
  const [listOpened, { open: openList, close: closeList }] = useDisclosure(false);
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

  const fetchEvents = async () => {
    openList();
    setLoading(true);
    setError(null);
    try {
      const response = await getEvents();
      const allEvents = Array.isArray(response.data.data) ? response.data.data : [];
      setEvents(filterEventsThisWeek(allEvents));

      console.log(filterEventsThisWeek(allEvents));

    } catch {
      setError("Không thể tải lịch học. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

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
      await API.post(`/events/${selectedEvent.id}/skip`, {
        skip_date: skipDate,
      });
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

  return (
    <>
      <Button
        variant="light"
        fullWidth
        leftSection={<IconCalendar size={16} />}
        onClick={fetchEvents}
      >
        Lịch học tuần này
      </Button>

      <Modal
        opened={listOpened}
        onClose={closeList}
        title="Lịch học 7 ngày tới"
        size="xl"
        centered
      >
        {loading ? (
          <Center py="xl">
            <Loader size="md" />
          </Center>
        ) : error ? (
          <Text c="red" ta="center">{error}</Text>
        ) : events.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">
            Không có lịch học nào trong 7 ngày tới.
          </Text>
        ) : (
          <ScrollArea h={450}>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tên môn</Table.Th>
                  <Table.Th>Phòng</Table.Th>
                  <Table.Th>Thứ</Table.Th>
                  <Table.Th>Tiết</Table.Th>
                  <Table.Th>Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {events.map((item, index) => (
                  <Table.Tr key={item.id || index}>
                    <Table.Td fw={500}>{item.title}</Table.Td>
                    <Table.Td>
                      <Badge color="blue" variant="light">{item.room}</Badge>
                    </Table.Td>
                    <Table.Td>Thứ {item.day_of_week}</Table.Td>
                    <Table.Td>{item.period_start} - {item.period_end}</Table.Td>
                    <Table.Td>
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
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Modal>

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