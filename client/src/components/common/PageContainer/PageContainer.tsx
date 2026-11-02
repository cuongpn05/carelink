import React from 'react';
import './PageContainer.css';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  withGutter?: boolean;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  withGutter = false,
  className = '',
  children,
  ...props
}) => {
  const classNames = [
    'cds-page-container',
    withGutter ? 'cds-page-container--gutter' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export default PageContainer;

