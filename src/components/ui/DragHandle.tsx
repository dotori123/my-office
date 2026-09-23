import { cx } from './cx'

/** 끌어서 순서를 바꾸는 손잡이. 포커스를 두고 방향키로도 옮길 수 있다 */
export function DragHandle({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="끌어서 순서 바꾸기 (방향키로도 옮길 수 있어요)"
      title="끌어서 순서 바꾸기"
      className={cx(
        'inline-flex shrink-0 cursor-grab touch-none items-center justify-center rounded-[8px] px-1.5 py-1 text-mid transition-colors hover:bg-wash hover:text-ink active:cursor-grabbing',
        className,
      )}
      {...props}
    >
      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden>
        {[4, 8, 12].map((y) =>
          [3, 9].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />),
        )}
      </svg>
    </button>
  )
}
