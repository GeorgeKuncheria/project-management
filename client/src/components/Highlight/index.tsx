import React from 'react'

type Props = {
    // Text with matches wrapped in [[hl]]…[[/hl]]; falls back to `fallback` when absent.
    text?: string;
    fallback?: string | null;
}

const Highlight = ({text, fallback}: Props) => {
  if (!text) return <>{fallback}</>;
  const parts = text.split(/\[\[hl\]\]|\[\[\/hl\]\]/);
  // split removes the markers, so odd-indexed parts are the highlighted ones
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className='rounded bg-yellow-200 px-0.5 dark:bg-yellow-600 dark:text-white'>{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}

export default Highlight
