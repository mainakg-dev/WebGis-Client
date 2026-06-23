import { MediaPlayer, MediaProvider, TimeSlider } from '@vidstack/react'
import '@vidstack/react/player/styles/base.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
import '@vidstack/react/player/styles/default/theme.css'

export const VideoController = ({ url }: { url: string }) => {
  return (
    <MediaPlayer
      title="Sprite Fight"
      src={url}
      className="w-full h-full object-contain aspect-auto"
    >
      <MediaProvider />
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <TimeSlider.Root className="group relative mx-[7.5px] inline-flex h-10 w-full cursor-pointer touch-none select-none items-center outline-none aria-hidden:hidden">
          <TimeSlider.Track className="relative ring-sky-400 z-0 h-[5px] w-full rounded-sm bg-white/30 group-data-[focus]:ring-[3px]">
            <TimeSlider.TrackFill className="bg-indigo-400 absolute h-full w-[var(--slider-fill)] rounded-sm will-change-[width] z-0" />
            <TimeSlider.Progress className="absolute z-10 h-full w-[var(--slider-progress)] rounded-sm bg-white/50 will-change-[width]" />
          </TimeSlider.Track>
          <TimeSlider.Thumb className="absolute left-[var(--slider-fill)] top-1/2 z-20 h-8 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent  ring-white/40 transition-opacity opacity-100  will-change-[left]">
            {/* Creates the gap */}
            <div className="absolute inset-0 bg-black " />
            {/* Actual thumb */}
            <div
              className="
        absolute
        left-1/2
        top-1/2
        h-7
        w-[2px]
        -translate-x-1/2
        -translate-y-1/2
        rounded-full
        bg-white
        
      "
            />
          </TimeSlider.Thumb>
        </TimeSlider.Root>
      </div>
    </MediaPlayer>
  )
}
