import Link from 'next/link';

interface LogoProps {
  className?: string;
  height?: number;
}

export default function Logo({ className = '', height = 40 }: LogoProps) {
  const width = height * (1040 / 300);

  return (
    <Link href="/" className={`inline-block ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1040 300"
        width={width}
        height={height}
        aria-label="SecureLend - Kira Güvencesi"
      >
        {/* LEFT BRACKET */}
        <path
          d="M 130 70 L 95 70 L 95 230 L 130 230"
          fill="none"
          stroke="#C73E1D"
          strokeWidth="7"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* RIGHT BRACKET */}
        <path
          d="M 910 70 L 945 70 L 945 230 L 910 230"
          fill="none"
          stroke="#C73E1D"
          strokeWidth="7"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Serial mark above-left */}
        <text
          x="95"
          y="55"
          fontFamily="'Inter','Söhne',Arial,sans-serif"
          fontSize="10"
          fontWeight="500"
          fill="#C73E1D"
          letterSpacing="2"
        >
          N°&#160;01&#8201;/&#8201;MMXXVI
        </text>
        {/* Serial mark above-right */}
        <text
          x="945"
          y="55"
          textAnchor="end"
          fontFamily="'Inter','Söhne',Arial,sans-serif"
          fontSize="10"
          fontWeight="500"
          fill="#C73E1D"
          letterSpacing="2"
        >
          TR&#160;·&#160;İSTANBUL
        </text>
        {/* WORDMARK */}
        <text
          x="520"
          y="172"
          textAnchor="middle"
          fontFamily="'Inter','Söhne','GT America','Helvetica Neue',Arial,sans-serif"
          fontSize="92"
          fontWeight="500"
          fill="#0B1220"
          letterSpacing="-4"
        >
          secure<tspan fontWeight="800">Lend</tspan>
        </text>
        {/* TAGLINE */}
        <text
          x="520"
          y="212"
          textAnchor="middle"
          fontFamily="'Inter','Söhne',Arial,sans-serif"
          fontSize="11"
          fontWeight="500"
          fill="#5B6675"
          letterSpacing="5.2"
        >
          KİRA&#160;&#160;GÜVENCESİ&#160;&#160;·&#160;&#160;UNDERWRITTEN&#160;&#160;TRUST
        </text>
      </svg>
    </Link>
  );
}
