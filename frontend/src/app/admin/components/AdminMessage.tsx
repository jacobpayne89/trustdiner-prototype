"use client";

interface AdminMessageProps {
  message: {
    type: 'success' | 'error';
    text: string;
  } | null;
}

export default function AdminMessage({ message }: AdminMessageProps) {
  if (!message) return null;

  return (
    <div className={`mb-6 p-4 rounded-md ${
      message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
    }`}>
      {message.text}
    </div>
  );
}

