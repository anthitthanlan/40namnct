import React from "react";

const SITE_URL = "https://40namnctru.nctitc.io.vn";

/**
 * Schema.org Dữ liệu có cấu trúc cho Trường học, Tổ chức & Chuỗi Sự kiện 40 năm
 */
export function SchoolAndEventsJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "School",
        "@id": `${SITE_URL}/#organization`,
        name: "Trường THPT Nguyễn Công Trứ",
        alternateName: [
          "THPT Nguyễn Công Trứ",
          "Trường THPT Thông Tây Hội",
          "Nguyen Cong Tru High School",
        ],
        url: SITE_URL,
        logo: `${SITE_URL}/images/Logo_40th_NCT.webp`,
        image: `${SITE_URL}/images/og-share.png`,
        foundingDate: "1986",
        slogan: "Làm cây thông đứng giữa trời mà reo",
        address: {
          "@type": "PostalAddress",
          streetAddress: "97 Quang Trung",
          addressLocality: "Phường Thông Tây Hội",
          addressRegion: "Thành phố Hồ Chí Minh",
          addressCountry: "VN",
        },
        telephone: "+84-28-38941546",
        email: "thptnguyencongtru@hcm.edu.vn",
        sameAs: [
          "https://thptnguyencongtru.hcm.edu.vn",
          "https://www.facebook.com/clb.Tin.nct",
        ],
        department: {
          "@type": "Organization",
          name: "CLB Tin học THPT Nguyễn Công Trứ (NCT ITC)",
          alternateName: "Nguyen Cong Tru High school Information Technology Club",
          url: SITE_URL,
        },
        keywords:
          "NCTru, NCT, THPTNguyenCongTru, TuHaoNguyenCongTru, THPTNguyenCongTru40Nam, THAPCHIVUONXA, NgayTroVe, CLBTinhocNCT, NCTITC",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "40 Năm THPT Nguyễn Công Trứ (1986 - 2026)",
        description:
          "Trang thông tin chính thức Chuỗi chương trình Kỷ niệm 40 năm Thành lập THPT Nguyễn Công Trứ (1986 - 2026).",
        inLanguage: "vi-VN",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
      {
        "@type": "Event",
        "@id": `${SITE_URL}/#event-ngay-tro-ve`,
        name: "Ngày Trở Về · Cựu học sinh & Thầy cô THPT Nguyễn Công Trứ",
        description:
          "Ngày trở về gặp gỡ, tri ân thầy cô và giao lưu giữa các thế hệ cựu học sinh nhân kỷ niệm 40 năm thành lập trường THPT Nguyễn Công Trứ.",
        startDate: "2026-11-08T07:30:00+07:00",
        endDate: "2026-11-08T12:00:00+07:00",
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: "Trường THPT Nguyễn Công Trứ",
          address: {
            "@type": "PostalAddress",
            streetAddress: "97 Quang Trung",
            addressLocality: "Phường Thông Tây Hội",
            addressRegion: "Thành phố Hồ Chí Minh",
            addressCountry: "VN",
          },
        },
        organizer: {
          "@type": "Organization",
          name: "BTC Chuỗi chương trình Kỷ niệm 40 năm Thành lập THPT Nguyễn Công Trứ",
          url: SITE_URL,
        },
        image: `${SITE_URL}/images/og-share.png`,
      },
      {
        "@type": "Event",
        "@id": `${SITE_URL}/#event-dai-le-40-nam`,
        name: "Đại Lễ Kỷ Niệm 40 Năm Thành Lập Trường THPT Nguyễn Công Trứ (1986 - 2026)",
        description:
          "Lễ kỷ niệm chính thức 40 năm thành lập Trường THPT Nguyễn Công Trứ với chủ đề Thắp Chí Vươn Xa và tinh thần Làm cây thông đứng giữa trời mà reo.",
        startDate: "2026-11-15T07:30:00+07:00",
        endDate: "2026-11-15T12:00:00+07:00",
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: "Trường THPT Nguyễn Công Trứ",
          address: {
            "@type": "PostalAddress",
            streetAddress: "97 Quang Trung",
            addressLocality: "Phường Thông Tây Hội",
            addressRegion: "Thành phố Hồ Chí Minh",
            addressCountry: "VN",
          },
        },
        organizer: {
          "@type": "Organization",
          name: "BTC Chuỗi chương trình Kỷ niệm 40 năm Thành lập THPT Nguyễn Công Trứ",
          url: SITE_URL,
        },
        image: `${SITE_URL}/images/og-share.png`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema.org Dữ liệu có cấu trúc cho Bài viết / Câu chuyện
 */
export function ArticleJsonLd({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  slug,
  basePath = "cau-chuyen",
}: {
  title: string;
  description: string;
  image?: string | null;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  slug: string;
  basePath?: string;
}) {
  const url = `${SITE_URL}/${basePath}/${slug}`;
  const resolvedImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`
    : `${SITE_URL}/images/og-share.png`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: title,
    description: description,
    image: [resolvedImage],
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: authorName || "Thành viên NCT",
    },
    publisher: {
      "@type": "Organization",
      name: "Trường THPT Nguyễn Công Trứ",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/Logo_40th_NCT.webp`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema.org BreadcrumbList hỗ trợ hiển thị đường dẫn trên Google Search
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
