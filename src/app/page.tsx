import HeroSlideshow from "@/components/HeroSlideshow";
import Link from "next/link";
import MediaUploader from "@/components/MediaUploader";
import MemoryGallery from "@/components/MemoryGallery";
import PostCard from "@/components/PostCard";
import Reveal from "@/components/Reveal";
import CountdownBadge from "@/components/CountdownBadge";
import ContributionCounter from "@/components/ContributionCounter";
import { listPublished } from "@/lib/posts";
import { listTickets } from "@/lib/members";

export const revalidate = 60;

export default async function Home() {
  const allPosts = await listPublished();
  const pinnedPosts = allPosts.filter((p) => p.pinned);
  const nonPinnedPosts = allPosts.filter((p) => !p.pinned).slice(0, 4);
  const homePosts = [...pinnedPosts, ...nonPinnedPosts];

  // Sổ sao kê đóng góp: chỉ tính các đơn vé ĐÃ DUYỆT (giống AdminRegistrations)
  const tickets = await listTickets();
  const confirmedTickets = tickets.filter((t) => t.status === "confirmed");
  const totalAmount = confirmedTickets.reduce((sum, t) => sum + t.amount, 0);
  const attendeeCount = confirmedTickets.reduce(
    (sum, t) => sum + (t.quantity || 1),
    0,
  );
  const memberCount = new Set(confirmedTickets.map((t) => t.memberId)).size;

  return (
    <main>
      <HeroSlideshow />

      {/* Giới thiệu */}
      <section
        id="gioi-thieu"
        className="mx-auto max-w-7xl px-6 py-32"
      >
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="text-left">
            <Reveal variant="left">
              <div className="inline-flex items-center gap-3 text-xs font-extrabold tracking-widest text-[#1d4ed8] sm:text-sm">
                <span className="h-0.5 w-6 rounded-full bg-[#1d4ed8]" />
                <span>🌿 40 NĂM · MỘT MÁI TRƯỜNG</span>
              </div>
            </Reveal>
            <Reveal delay={100} variant="left">
              <h2 className="mt-6 text-4xl font-extrabold leading-snug text-slate-900 sm:text-5xl">
                &ldquo;Có một nơi để trở về - nơi ấy gọi tên THPT Nguyễn Công
                Trứ.&rdquo;
              </h2>
            </Reveal>
            <Reveal delay={180} variant="left">
              <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
                Tháng 8 năm 1986, giữa vùng đất Thông Tây Hội giàu truyền thống,
                những viên gạch đầu tiên của Trường THPT Thông Tây Hội được đặt
                xuống, mở đầu cho một hành trình gieo chữ, trồng người. Đến tháng 9
                năm 1992, ngôi trường chính thức mang tên Trường THPT Nguyễn Công
                Trứ - mang tên vị Uy Viễn Tướng Công với tinh thần:{" "}
                <em className="font-semibold text-slate-800">
                  &ldquo;Làm cây thông đứng giữa trời mà reo.&rdquo;
                </em>
              </p>
            </Reveal>
            <Reveal delay={240} variant="left">
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                🌱 40 năm - một chặng đường được viết bằng bao thế hệ. Dưới mái
                trường Nguyễn Công Trứ, biết bao thế hệ học sinh đã trưởng thành.
                Từ nơi đây, các em mang theo tri thức, nhân cách và tình yêu thương,
                tự tin bước vào cuộc đời, cống hiến cho gia đình, quê hương và xã hội.
              </p>
            </Reveal>
            <Reveal delay={300} variant="left">
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                Mỗi thành công của những người con Nguyễn Công Trứ hôm nay đều là
                một niềm tự hào của mái trường. Mỗi câu chuyện, mỗi kỷ niệm, mỗi
                hình ảnh của ngày tháng cũ đều là một phần ký ức quý giá làm nên bản sắc Nguyễn Công Trứ.
              </p>
            </Reveal>
          </div>
          
          <Reveal delay={400} variant="zoom" className="h-full mt-10 lg:mt-0">
            <div className="relative flex h-full min-h-[420px] flex-col items-center justify-end overflow-hidden rounded-[2.5rem] p-6 sm:p-10 text-center text-white shadow-2xl">
              {/* Hình nền không có lớp phủ xám toàn bộ */}
              <div className="absolute inset-0 bg-[url('/images/hero-2.jpg')] bg-cover bg-center"></div>
              
              {/* Lớp phủ blur-gradient-dimmer ở dưới */}
              <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none backdrop-blur-sm [mask-image:linear-gradient(to_top,black_20%,transparent)]"></div>

              {/* Nội dung icon và text */}
              <span className="material-symbols-rounded relative z-10 mb-3 text-5xl sm:text-6xl text-emerald-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">forest</span>
              <h3 className="relative z-10 mb-3 text-[1.75rem] leading-[1.3] font-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] sm:text-4xl">Làm cây thông đứng giữa trời mà reo</h3>
              <p className="relative z-10 text-sm sm:text-base font-medium tracking-wide text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Uy Viễn Tướng Công - Nguyễn Công Trứ</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Lễ kỷ niệm 40 năm - Ngày trở về */}
    <section
        id="le-ky-niem"
        className="mx-auto max-w-7xl px-6 py-12 text-center"
      >
        <Reveal>
          <div className="inline-flex items-center gap-3 text-sm font-extrabold tracking-widest text-[#16a34a] sm:text-base">
            <span className="h-0.5 w-6 rounded-full bg-[#16a34a]" />
            <span className="flex items-center gap-1.5"><span className="material-symbols-rounded text-[1.25em]">school</span> LỄ KỶ NIỆM 40 NĂM THÀNH LẬP TRƯỜNG (1986 - 2026)</span>
            <span className="h-0.5 w-6 rounded-full bg-[#16a34a]" />
          </div>
        </Reveal>
        
        <div className="mt-14 grid gap-4 lg:gap-8 md:grid-cols-12 md:grid-rows-2">
          {/* Main Content (Removed Box Styling) */}
          <Reveal delay={100} className="md:col-span-7 md:row-span-2 flex flex-col justify-center text-left">
            <h2 className="relative z-10 text-4xl font-black leading-tight text-slate-900 sm:text-5xl">
              08/11/2026<br />&ldquo;NGÀY TRỞ VỀ&rdquo;
            </h2>
            <p className="relative z-10 mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Ngày 08/11/2026, Trường THPT Nguyễn Công Trứ trân trọng tổ chức{" "}
              <strong className="font-extrabold text-slate-900">
                Lễ kỷ niệm 40 năm thành lập trường
              </strong>
              . Đây không chỉ là ngày nhìn lại một hành trình đáng tự hào, mà còn
              là ngày các thế hệ Thầy Cô và học sinh cùng hội ngộ dưới mái trường thân thương.
            </p>
            <div className="relative z-10 mt-10 flex flex-wrap gap-4">
              <Link
                href="/dang-ky"
                className="group icon-hover-morph relative inline-flex pb-1 text-lg font-bold text-[#16a34a] transition-colors hover:text-emerald-700"
              >
                <span className="flex items-center gap-1.5">Đăng ký tham gia ngay <span className="transition-transform duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover:translate-x-1.5"><span className="material-symbols-rounded text-[1.25em] block">send</span></span></span>
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#16a34a] opacity-0 scale-x-0 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover:opacity-100 group-hover:scale-x-100" />
              </Link>
            </div>
          </Reveal>

          {/* Secondary Bento Box 1 - Removed box styling */}
          <Reveal delay={180} className="md:col-span-5 md:row-span-1 flex flex-col justify-center">
            <div className="flex h-full flex-col justify-center p-4 md:pl-0">
              <CountdownBadge />
            </div>
          </Reveal>

          {/* Secondary Bento Box 2 - Removed box styling and icon */}
          <Reveal delay={240} className="md:col-span-5 md:row-span-1 flex flex-col justify-start">
            <div className="flex flex-col p-4 text-left md:pl-0 border-t border-slate-200/60 pt-6 mt-2">
              <Link 
                href="/timeline" 
                className="group inline-flex items-center gap-4 text-base font-medium leading-relaxed text-slate-600 hover:text-[#16a34a] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
              >
                <span className="max-w-[280px]">Khám phá cột mốc phát triển của nhà trường qua các thời kỳ.</span>
                <span className="material-symbols-rounded rounded-full bg-slate-100 p-1 text-[1.2rem] text-slate-500 !transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover:translate-x-1.5 group-hover:bg-[#16a34a] group-hover:text-white group-hover:shadow-md">
                  arrow_forward_ios
                </span>
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Chương trình dự kiến */}
        <div className="mt-24 mx-auto max-w-4xl text-left">
          <Reveal delay={300}>
            <div className="flex flex-col items-center text-center mb-12">
              <h3 className="text-3xl font-black text-slate-900">
                Chương trình dự kiến
              </h3>
              <p className="mt-3 text-slate-600">Lịch trình các hoạt động chính trong Ngày trở về (08/11/2026)</p>
            </div>
          </Reveal>

          <div className="relative border-l-2 border-[#16a34a]/20 pl-8 ml-4 md:ml-12 space-y-10">
            {[
              {
                time: "07:30",
                title: "Đón khách & Tham quan Triển lãm 40 năm",
                desc: "Trưng bày ảnh, kỷ vật, học bạ, sổ liên lạc của các thế hệ học sinh.",
                icon: "groups"
              },
              {
                time: "08:30",
                title: "Lễ Kỷ Niệm Chính Thức",
                desc: "Ôn lại hoàn cảnh ra đời của trường, xem film tư liệu 40 năm, lắng nghe phát biểu của đại biểu và đại diện các thế hệ.",
                icon: "celebration"
              },
              {
                time: "10:00",
                title: "Lễ Tri ân & Vinh danh",
                desc: "Vinh danh Thầy Cô giáo về hưu, tri ân các thế hệ cựu học sinh tiêu biểu.",
                icon: "award_star"
              },
              {
                time: "10:45",
                title: "Công bố Quỹ học bổng",
                desc: 'Ra mắt Quỹ học bổng "Uyên bác - Nhân ái - Giàu chí khí" nhằm hỗ trợ các thế hệ học sinh hiếu học.',
                icon: "local_library"
              },
              {
                time: "11:30",
                title: "Giao lưu & Chụp ảnh lưu niệm",
                desc: "Các thế hệ gặp mặt, giao lưu theo từng khóa và chụp ảnh lưu niệm tại các góc check-in kỷ niệm.",
                icon: "photo_camera"
              }
            ].map((item, i) => (
              <Reveal key={i} delay={300 + i * 100} variant="left">
                <div className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[41px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-[#16a34a] shadow-sm transition-transform duration-[var(--duration-fast)] group-hover:scale-125 group-hover:bg-[#1d4ed8]" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                    <div className="shrink-0 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-[#16a34a]">
                        <span className="material-symbols-rounded text-[1.2rem]">{item.icon}</span> {item.time}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 group-hover:text-[#1d4ed8] transition-colors duration-[var(--duration-fast)]">{item.title}</h4>
                      <p className="mt-2 text-base leading-relaxed text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Câu chuyện & bài viết */}
      <section
        id="bai-viet"
        className="mx-auto max-w-7xl px-6 py-24 text-center"
      >
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-end md:text-left">
          <div className="max-w-2xl">
            <Reveal variant="left">
              <div className="inline-flex items-center gap-3 text-xs font-extrabold tracking-widest text-[#16a34a] sm:text-sm">
                <span className="h-0.5 w-6 rounded-full bg-[#16a34a]" />
                <span className="flex items-center gap-1.5"><span className="material-symbols-rounded text-[1.25em]">menu_book</span> CÂU CHUYỆN &amp; BÀI VIẾT MỚI NHẤT</span>
              </div>
            </Reveal>
            <Reveal delay={100} variant="left">
              <h2 className="mt-5 text-4xl font-black text-slate-900 sm:text-5xl">
                Viết tiếp hành trình 40 năm
              </h2>
            </Reveal>
            <Reveal delay={180} variant="left">
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                Đọc những bài viết, ký ức của các thế hệ Thầy trò Nguyễn Công Trứ -
                hoặc kể lại câu chuyện riêng của bạn.
              </p>
            </Reveal>
          </div>
          
          <Reveal delay={260} variant="right" className="shrink-0">
            <div className="flex gap-4">
              <Link
                href="/bai-viet"
                className="group relative inline-flex pb-1 text-base font-bold text-[#1d4ed8] transition-colors hover:text-blue-800"
              >
                <span>Xem tất cả ({allPosts.length})</span>
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#1d4ed8] opacity-0 scale-x-0 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover:opacity-100 group-hover:scale-x-100" />
              </Link>
              <Link
                href="/bai-viet/chia-se"
                className="group relative inline-flex pb-1 text-base font-bold text-slate-700 transition-colors hover:text-slate-900"
              >
                <span className="flex items-center gap-1.5"><span className="material-symbols-rounded text-[1.25em]">edit</span> Gửi bài</span>
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-slate-700 opacity-0 scale-x-0 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover:opacity-100 group-hover:scale-x-100" />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Danh sách bài viết: bài ghim + 4 bài mới nhất */}
        {homePosts.length > 0 && (
          <div className="mt-16 grid gap-8 text-left sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {homePosts.map((post, i) => (
              <Reveal key={post.id} delay={(i % 4) * 80} className="h-full">
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Sổ sao kê đóng góp - tổng số tiền đã xác nhận */}
      <ContributionCounter
        orderCount={confirmedTickets.length}
        attendeeCount={attendeeCount}
        memberCount={memberCount}
      />

      {/* Đóng góp Media / CTA */}
      <section
        id="dong-gop"
        className="relative overflow-hidden bg-gradient-to-b from-[#1d4ed8] to-[#0f172a] py-32 text-white"
      >
        <div className="mx-auto max-w-7xl px-6">
          {/* Tiêu đề chung (Căn giữa ngang) */}
          <div className="mb-16 text-center">
            <Reveal variant="up">
              <div className="inline-flex items-center gap-3 text-xs font-extrabold tracking-widest text-blue-200 sm:text-sm">
                <span className="h-0.5 w-6 rounded-full bg-blue-300" />
                <span className="flex items-center gap-1.5"><span className="material-symbols-rounded text-[1.25em]">add_a_photo</span> GÓP MỘT KỶ NIỆM</span>
                <span className="h-0.5 w-6 rounded-full bg-blue-300" />
              </div>
            </Reveal>
            <Reveal variant="up" delay={100}>
              <h2 className="mt-5 text-5xl font-black leading-tight sm:text-6xl">
                Lưu giữ lại một thời để nhớ
              </h2>
            </Reveal>
            <Reveal variant="up" delay={180}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-blue-100 sm:text-lg">
                Mỗi bức ảnh cũ, kỷ vật hay câu chuyện là một mảnh ghép quý giá làm
                nên bức tranh 40 năm của mái trường Nguyễn Công Trứ.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
            {/* Cột trái: Form tải ảnh */}
            <div className="lg:col-span-5">
              <Reveal variant="up" delay={240}>
                <div>
                  <MediaUploader />
                </div>
              </Reveal>
            </div>

            {/* Cột phải: Gallery và CTA chung tay */}
            <div className="lg:col-span-7">
              {/* Triển lãm ký ức trực tiếp */}
              <Reveal variant="up" delay={300}>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                    Góc kỷ niệm được gửi về gần đây
                  </span>
                  <div className="mt-6">
                    <MemoryGallery />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Chung tay góp sức (Không Box) */}
          <Reveal variant="up" delay={120}>
            <div className="mt-20 border-t border-white/10 pt-16 text-center text-white">
              <h3 className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xl font-extrabold sm:text-2xl">
                <span className="material-symbols-rounded text-4xl text-amber-300">handshake</span>
                <span>Chung tay góp sức - Đồng lòng hướng về kỷ niệm 40 năm thành lập trường</span>
              </h3>
              <p className="mx-auto mt-4 max-w-4xl text-sm leading-relaxed text-blue-100 sm:text-base">
                Nhà trường trân trọng đón nhận sự đồng hành, ủng hộ của các thế
                hệ Thầy Cô, cựu học sinh, phụ huynh và những người yêu mến
                Nguyễn Công Trứ để thực hiện các công trình lưu niệm, xây dựng
                Quỹ học bổng hỗ trợ học sinh và tổ chức những hoạt động kỷ niệm
                ý nghĩa, thiết thực.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm font-bold text-white">
                <span className="flex items-center gap-1.5"><span className="material-symbols-rounded text-emerald-400">volunteer_activism</span> Mỗi sự đóng góp là một lời tri ân.</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-rounded text-rose-400">volunteer_activism</span> Mỗi kỷ vật là một mảnh ghép ký ức.</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-rounded text-blue-400">volunteer_activism</span> Mỗi lần trở về là một lần viết tiếp câu chuyện.</span>
              </div>
            </div>
          </Reveal>

          {/* Thông tin tiếp nhận đóng góp */}
          <Reveal variant="up" delay={180}>
            <div className="mt-12 flex flex-wrap justify-center gap-12 text-center">
              <a
                href="tel:02838941546"
                className="group icon-hover-morph flex flex-col items-center gap-3 transition-all hover:opacity-80 hover:-translate-y-1"
              >
                <span className="material-symbols-rounded text-[2.5rem] drop-shadow-lg">call</span>
                <span>
                  <span className="block text-xs font-semibold text-blue-200">
                    Số điện thoại
                  </span>
                  <span className="block mt-1 text-sm font-extrabold text-white">
                    (028) 38941546
                  </span>
                </span>
              </a>
              <a
                href="https://thptnguyencongtru.hcm.edu.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="group icon-hover-morph flex flex-col items-center gap-3 transition-all hover:opacity-80 hover:-translate-y-1"
              >
                <span className="material-symbols-rounded text-[2.5rem] drop-shadow-lg">language</span>
                <span>
                  <span className="block text-xs font-semibold text-blue-200">
                    Website
                  </span>
                  <span className="block mt-1 text-sm font-extrabold text-white">
                    thptnguyencongtru.hcm.edu.vn
                  </span>
                </span>
              </a>
              <div className="group icon-hover-morph flex flex-col items-center gap-3 transition-all hover:opacity-80 hover:-translate-y-1">
                <span className="material-symbols-rounded text-[2.5rem] drop-shadow-lg">location_on</span>
                <span>
                  <span className="block text-xs font-semibold text-blue-200">
                    Địa chỉ
                  </span>
                  <span className="block mt-1 text-sm font-extrabold text-white">
                    97 Quang Trung, P. Thông Tây Hội, Gò Vấp
                  </span>
                </span>
              </div>
              <a
                href="mailto:thptnguyencongtru@hcm.edu.vn"
                className="group icon-hover-morph flex flex-col items-center gap-3 transition-all hover:opacity-80 hover:-translate-y-1"
              >
                <span className="material-symbols-rounded text-[2.5rem] drop-shadow-lg">mail</span>
                <span>
                  <span className="block text-xs font-semibold text-blue-200">
                    Hộp thư tư liệu
                  </span>
                  <span className="block mt-1 text-sm font-extrabold text-white">
                    thptnguyencongtru@hcm.edu.vn
                  </span>
                </span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
