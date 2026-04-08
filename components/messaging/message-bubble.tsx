import { FileText, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MessageBubbleProps {
  content:    string | null
  fileUrl:    string | null
  fileName:   string | null
  fileSize:   number | null
  createdAt:  string
  isMine:     boolean
  senderName: string
}

export function MessageBubble({
  content, fileUrl, fileName, fileSize, createdAt, isMine, senderName,
}: MessageBubbleProps) {
  const time = formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr })

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] space-y-1`}>
        {!isMine && (
          <p className="text-[10px] text-muted-foreground px-1">{senderName}</p>
        )}
        <div className={`rounded-2xl px-4 py-2.5 text-sm space-y-1.5
          ${isMine
            ? 'bg-[#1B3A6B] text-white rounded-tr-sm'
            : 'bg-white border text-[#333] rounded-tl-sm shadow-sm'
          }`}>
          {content && <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>}
          {fileUrl && fileName && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 mt-1 rounded-lg p-2 text-xs font-medium
                ${isMine ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-50 hover:bg-gray-100 text-[#1B3A6B]'}`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 truncate">{fileName}</span>
              {fileSize && (
                <span className="shrink-0 opacity-70">
                  {fileSize > 1048576
                    ? `${(fileSize / 1048576).toFixed(1)} Mo`
                    : `${Math.round(fileSize / 1024)} Ko`}
                </span>
              )}
              <Download className="w-3 h-3 shrink-0" />
            </a>
          )}
        </div>
        <p className={`text-[10px] text-muted-foreground px-1 ${isMine ? 'text-right' : ''}`}>
          {time}
        </p>
      </div>
    </div>
  )
}
