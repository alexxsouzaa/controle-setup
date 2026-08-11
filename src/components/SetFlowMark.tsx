import * as React from 'react';

interface SetFlowMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function SetFlowMark({ className = '', ...props }: SetFlowMarkProps) {
  return (
    <svg viewBox="0 0 27 36.2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" focusable="false" {...props}>
      <path d="M13.536 36.144C5.328 36.144 0 31.776 0 24.432H9.552C9.552 26.832 11.424 28.032 13.536 28.032C15.456 28.032 17.328 26.976 17.328 25.152C17.328 23.04 14.688 22.416 11.472 21.648C6.624 20.448 0.432 18.96 0.432 11.328C0.432 4.704 5.28 0.912 13.2 0.912C21.264 0.912 25.92 5.04 25.92 11.904H16.608C16.608 9.744 15.024 8.736 13.104 8.736C11.472 8.736 9.888 9.456 9.888 11.04C9.888 12.96 12.432 13.584 15.552 14.4C20.544 15.648 26.976 17.328 26.976 24.96C26.976 32.304 21.36 36.144 13.536 36.144Z" />
    </svg>
  );
}
