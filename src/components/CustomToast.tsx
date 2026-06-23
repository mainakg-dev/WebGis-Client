import { BadgeAlert, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
export default function CustomToast({
  type,
  headline,
  description,
}: {
  type: 'success' | 'failure'
  headline: string
  description: string
}) {
  const createdAt = new Date().toLocaleTimeString()
  return toast((t) => (
    <div
      className={`toastTopDiv ${
        type === 'success'
          ? 'bg-green-100 border-green-500'
          : 'bg-red-100 border-red-500'
      }`}
    >
      {/* Close button */}
      <button onClick={() => toast.dismiss(t.id)} className="toastCrossBtn">
        <X strokeWidth={3} />
      </button>
      <div className="p-4 pr-10">
        {/* Success icon and title */}
        <div className="flex items-start gap-3 mb-2">
          <div className="shrink-0 mt-0.5">
            <div
              className={`iconDiv ${type === 'success' ? 'bg-green-500' : ''}`}
            >
              {type === 'success' ? (
                <Check strokeWidth={3} color="white" size={22} />
              ) : (
                <BadgeAlert strokeWidth={3} color="red" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 font-semibold text-base">
              {headline}
            </h3>
          </div>
        </div>
        {/* Message */}
        <div className="ml-9">
          <p className="text-gray-700 text-sm mb-3">{description}</p>
          {/* Timestamp */}
          <p className="text-gray-600 text-sm font-medium">{createdAt}</p>
        </div>
      </div>
    </div>
  ))
}
