import React from 'react';

export const SchoolBuildLoader = ({ size = 48, color = "currentColor", className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="status"
    aria-label="Loading"
  >
    {/* Mái nhà */}
    <path d="m4 6 8-4 8 4" pathLength="1" className="anim-build anim-build-1" />
    {/* Tường trái & phải */}
    <path d="M6 5v17" pathLength="1" className="anim-build anim-build-2" />
    <path d="M18 5v17" pathLength="1" className="anim-build anim-build-2" />
    {/* 2 bên chái nhà */}
    <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" pathLength="1" className="anim-build anim-build-3" />
    {/* Cửa ra vào */}
    <path d="M14 22v-4a2 2 0 1 0-4 0v4" pathLength="1" className="anim-build anim-build-4" />
    {/* Cửa sổ/Đồng hồ */}
    <circle cx="12" cy="9" r="2" pathLength="1" className="anim-build anim-build-5" />
  </svg>
);
