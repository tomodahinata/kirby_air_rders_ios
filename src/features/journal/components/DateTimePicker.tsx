import { memo, useCallback, useState } from 'react';
import { View, Text, Pressable, Platform, Modal, SafeAreaView } from 'react-native';
import DateTimePickerRN from '@react-native-community/datetimepicker';
import { Calendar, Clock, Check, X } from 'lucide-react-native';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  label?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string;
  className?: string;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

function DateTimePickerComponent({
  value,
  onChange,
  mode = 'datetime',
  label,
  maximumDate,
  minimumDate,
  error,
  className = '',
}: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const displayValue =
    mode === 'date'
      ? formatDate(value)
      : mode === 'time'
        ? formatTime(value)
        : formatDateTime(value);

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
        if (selectedDate) {
          if (mode === 'datetime') {
            setTempDate(selectedDate);
            setShowTimePicker(true);
          } else {
            onChange(selectedDate);
          }
        }
      } else {
        if (selectedDate) {
          setTempDate(selectedDate);
        }
      }
    },
    [mode, onChange]
  );

  const handleTimeChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
        if (selectedDate) {
          onChange(selectedDate);
        }
      } else {
        if (selectedDate) {
          setTempDate(selectedDate);
        }
      }
    },
    [onChange]
  );

  const handleIOSConfirm = useCallback(() => {
    onChange(tempDate);
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [tempDate, onChange]);

  const handleIOSCancel = useCallback(() => {
    setTempDate(value);
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [value]);

  const openPicker = useCallback(() => {
    setTempDate(value);
    if (mode === 'time') {
      setShowTimePicker(true);
    } else {
      setShowDatePicker(true);
    }
  }, [mode, value]);

  const renderIOSModal = (pickerMode: 'date' | 'time', visible: boolean, onClose: () => void) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/30">
        <SafeAreaView className="bg-white rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Pressable onPress={handleIOSCancel} className="p-2">
              <X size={24} color="#6b7280" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">
              {pickerMode === 'date' ? '日付を選択' : '時間を選択'}
            </Text>
            <Pressable onPress={handleIOSConfirm} className="p-2">
              <Check size={24} color="#ea580c" />
            </Pressable>
          </View>

          {/* Picker */}
          <View className="px-4 py-6">
            <DateTimePickerRN
              value={tempDate}
              mode={pickerMode}
              display="spinner"
              onChange={pickerMode === 'date' ? handleDateChange : handleTimeChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              locale="ja-JP"
            />
          </View>

          {/* Mode=datetime: Show next/confirm button */}
          {mode === 'datetime' && pickerMode === 'date' && (
            <View className="px-4 pb-6">
              <Pressable
                onPress={() => {
                  setShowDatePicker(false);
                  setShowTimePicker(true);
                }}
                className="bg-orange-600 rounded-xl py-4 active:bg-orange-700"
              >
                <Text className="text-white font-semibold text-center text-base">時間を選択</Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <View className={className}>
      {label && <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>}

      <Pressable
        onPress={openPicker}
        className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        <View className="flex-row items-center flex-1 gap-3">
          {mode === 'time' ? (
            <Clock size={20} color="#6b7280" />
          ) : (
            <Calendar size={20} color="#6b7280" />
          )}
          <Text className="text-base text-gray-900">{displayValue}</Text>
        </View>
      </Pressable>

      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}

      {/* iOS Modal Pickers */}
      {Platform.OS === 'ios' && (
        <>
          {renderIOSModal('date', showDatePicker, handleIOSCancel)}
          {renderIOSModal('time', showTimePicker, handleIOSCancel)}
        </>
      )}

      {/* Android Inline Pickers */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePickerRN
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePickerRN
          value={tempDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

export const DateTimePicker = memo(DateTimePickerComponent);
