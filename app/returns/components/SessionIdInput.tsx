interface SessionIdInputProps {
  sessionId: string
  onSessionIdChange: (value: string) => void
}

export function SessionIdInput({ sessionId, onSessionIdChange }: SessionIdInputProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <label className="block text-sm font-semibold mb-2">
        Session ID (x-session-id) *
      </label>
      <input
        type="text"
        value={sessionId}
        onChange={(e) => onSessionIdChange(e.target.value)}
        placeholder="Digite o session ID"
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
      />
    </div>
  )
}

