import HeroSlideshow from "@/components/HeroSlideshow";
import MediaUploader from "@/components/MediaUploader";
import MemoryGallery from "@/components/MemoryGallery";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <main>
      <HeroSlideshow />

      {/* Giới thiệu */}
      <section
        id="gioi-thieu"
        className="mx-auto max-w-4xl px-6 py-24 text-center"
      >
        <Reveal>
          <span className="btn-pop-soft inline-block rounded-2xl bg-white px-6 py-3 text-sm font-extrabold tracking-widest text-[#1d4ed8]">
            🌿 40 NĂM - MỘT MÁI TRƯỜNG, MUÔN VẠN YÊU THƯƠNG
          </span>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            &ldquo;Có một nơi để trở về - nơi ấy gọi tên THPT Nguyễn Công
            Trứ.&rdquo;
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
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
        <Reveal delay={240}>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            🌱 40 năm - một chặng đường được viết bằng bao thế hệ. Dưới mái
            trường Nguyễn Công Trứ, biết bao thế hệ học sinh đã trưởng thành.
            Từ nơi đây, các em mang theo tri thức, nhân cách và tình yêu thương,
            tự tin bước vào cuộc đời, cống hiến cho gia đình, quê hương và xã
            hội.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Mỗi thành công của những người con Nguyễn Công Trứ hôm nay đều là
            một niềm tự hào của mái trường. Mỗi câu chuyện, mỗi kỷ niệm, mỗi
            hình ảnh của ngày tháng cũ đều là một phần ký ức quý giá làm nên
            bản sắc Nguyễn Công Trứ.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-wrap justify-center gap-5">
          <Reveal variant="zoom" delay={0} className="btn-pop-soft bg-white px-7 py-5">
            <span className="block text-2xl">🎓</span>
            <span className="mt-2 block text-sm font-bold text-slate-900">
              Truyền thống hiếu học
            </span>
          </Reveal>
          <Reveal variant="zoom" delay={120} className="btn-pop-soft bg-white px-7 py-5">
            <span className="block text-2xl">🤝</span>
            <span className="mt-2 block text-sm font-bold text-slate-900">
              Cộng đồng gắn kết
            </span>
          </Reveal>
          <Reveal variant="zoom" delay={240} className="btn-pop-soft bg-white px-7 py-5">
            <span className="block text-2xl">🌱</span>
            <span className="mt-2 block text-sm font-bold text-slate-900">
              Đổi mới & sáng tạo
            </span>
          </Reveal>
        </div>
      </section>

      {/* Lễ kỷ niệm 40 năm - Ngày trở về */}
      <section
        id="le-ky-niem"
        className="mx-auto max-w-4xl px-6 py-20 text-center"
      >
        <Reveal>
          <span className="btn-pop-soft inline-block rounded-2xl bg-white px-6 py-3 text-sm font-extrabold tracking-widest text-[#16a34a]">
            🎓 LỄ KỶ NIỆM 40 NĂM THÀNH LẬP TRƯỜNG (1986 - 2026)
          </span>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            15/11/2026 - &ldquo;NGÀY TRỞ VỀ&rdquo; mái trường Nguyễn Công Trứ
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Ngày 15/11/2026, Trường THPT Nguyễn Công Trứ trân trọng tổ chức{" "}
            <strong className="font-extrabold text-slate-900">
              Lễ kỷ niệm 40 năm thành lập trường (1986 - 2026)
            </strong>
            . Đây không chỉ là ngày nhìn lại một hành trình đáng tự hào, mà còn
            là{" "}
            <strong className="font-extrabold text-slate-900">
              &ldquo;NGÀY TRỞ VỀ&rdquo;
            </strong>{" "}
            - ngày các thế hệ Thầy Cô, cựu học sinh và học sinh cùng hội ngộ
            dưới mái trường thân thương, ôn lại những năm tháng tuổi trẻ, gặp
            lại những người đã từng đồng hành và viết tiếp câu chuyện đầy tự
            hào về THPT Nguyễn Công Trứ.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            📖 Ban Tổ chức tha thiết mời gọi các thế hệ Thầy Cô, cựu học sinh,
            phụ huynh và học sinh cùng chung tay góp sức cho ngày hội lớn của
            mái trường.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-bold text-slate-700">
            <span className="btn-pop-soft rounded-full bg-white px-5 py-2.5">
              📅 15/11/2026
            </span>
            <span className="btn-pop-soft rounded-full bg-white px-5 py-2.5">
              📍 97 Quang Trung, TP. Hồ Chí Minh
            </span>
            <span className="btn-pop-soft rounded-full bg-white px-5 py-2.5">
              🎫 Vé cá nhân miễn phí · vé tập thể 200.000đ/suất
            </span>
          </div>
        </Reveal>
        <Reveal delay={360}>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="/dang-ky"
              className="btn-pop bg-[#16a34a] px-7 py-3.5 text-base font-bold text-white"
            >
              🎟 Đăng ký tham dự ngay
            </a>
            <a
              href="/timeline"
              className="btn-pop-soft bg-white px-7 py-3.5 text-base font-bold text-slate-900"
            >
              🚀 Khám phá hành trình 40 năm
            </a>
          </div>
        </Reveal>
      </section>

      {/* Câu chuyện & bài viết */}
      <section
        id="bai-viet"
        className="mx-auto max-w-5xl px-6 pb-8 pt-4 text-center"
      >
        <Reveal>
          <span className="btn-pop-soft inline-block rounded-2xl bg-white px-6 py-3 text-sm font-extrabold tracking-widest text-[#16a34a]">
            📖 CÂU CHUYỆN &amp; BÀI VIẾT
          </span>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Những câu chuyện viết tiếp hành trình 40 năm
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Đọc những bài viết, ký ức của các thế hệ Thầy trò Nguyễn Công Trứ -
            hoặc kể lại câu chuyện riêng của bạn với Trứ. Mỗi chia sẻ sau khi
            được duyệt sẽ trở thành một mảnh ghép của Triển lãm 40 năm.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="/bai-viet"
              className="btn-pop bg-[#1d4ed8] px-7 py-3.5 text-base font-bold text-white"
            >
              📖 Đọc bài viết
            </a>
            <a
              href="/bai-viet/chia-se"
              className="btn-pop-soft bg-white px-7 py-3.5 text-base font-bold text-slate-900"
            >
              ✍️ Chia sẻ câu chuyện của bạn
            </a>
          </div>
        </Reveal>
      </section>

      {/* Đóng góp Media / CTA */}
      <section
        id="dong-gop"
        className="relative overflow-hidden bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] py-24 text-white"
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal variant="up">
            <span className="btn-pop-soft inline-block rounded-2xl bg-white px-6 py-3 text-sm font-extrabold tracking-widest text-[#1d4ed8]">
              📸 GÓP MỘT KỶ NIỆM - LƯU GIỮ MỘT THỜI
            </span>
          </Reveal>
          <Reveal variant="up" delay={100}>
            <h2 className="mt-6 text-3xl font-extrabold sm:text-4xl">
              Đóng góp hình ảnh, tư liệu
              <br />
              cho Triển lãm 40 năm thành lập trường
            </h2>
          </Reveal>
          <Reveal variant="up" delay={180}>
            <p className="mt-5 text-base leading-relaxed text-slate-100 sm:text-lg">
              Bạn đang giữ một tấm ảnh cũ? Một cuốn học bạ? Một sổ liên lạc? Một
              chiếc phù hiệu? Một kỷ vật của những năm tháng dưới mái trường
              Nguyễn Công Trứ? Hay đơn giản chỉ là một câu chuyện, một ký ức mà
              mỗi lần nhớ lại, lòng vẫn thấy bồi hồi?
            </p>
          </Reveal>
          <Reveal variant="up" delay={260}>
            <p className="mt-4 text-base leading-relaxed text-slate-100 sm:text-lg">
              Xin hãy chia sẻ cùng nhà trường. Mỗi hình ảnh, mỗi kỷ vật, mỗi câu
              chuyện được gửi về sẽ góp phần tạo nên{" "}
              <strong className="font-extrabold text-white">
                Triển lãm 40 năm
              </strong>
              , để những ký ức tưởng như đã ngủ quên có cơ hội sống lại và được
              trao truyền cho các thế hệ mai sau.
            </p>
          </Reveal>

          {/* Upload media trực tiếp */}
          <Reveal variant="zoom" delay={320} className="mt-9">
            <MediaUploader />
          </Reveal>
          <Reveal variant="up" delay={380}>
            <p className="mt-4 text-sm font-semibold text-slate-200">
              📧 Hộp thư tiếp nhận tư liệu:{" "}
              <a
                href="mailto:thptnguyencongtru@hcm.edu.vn"
                className="underline decoration-2 underline-offset-4 hover:text-white"
              >
                thptnguyencongtru@hcm.edu.vn
              </a>
            </p>
          </Reveal>

          {/* Tường ký ức - gallery từ cộng đồng */}
          <Reveal variant="up" delay={420}>
            <div className="mt-14 text-left">
              <h3 className="text-center text-xl font-extrabold text-white sm:text-2xl">
                🖼 Tường ký ức - những gì cộng đồng đã gửi
              </h3>
              <div className="mt-6">
                <MemoryGallery />
              </div>
            </div>
          </Reveal>

          {/* Chung tay góp sức */}
          <Reveal variant="up" delay={120}>
            <div className="btn-pop-soft mt-14 rounded-3xl bg-white/10 p-8 text-left backdrop-blur-sm sm:p-10">
              <h3 className="text-center text-xl font-extrabold sm:text-2xl">
                🤝 Chung tay góp sức - Đồng lòng hướng về kỷ niệm 40 năm thành
                lập trường
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-100 sm:text-base">
                Nhà trường trân trọng đón nhận sự đồng hành, ủng hộ của các thế
                hệ Thầy Cô, cựu học sinh, phụ huynh và những người yêu mến
                Nguyễn Công Trứ để thực hiện các công trình lưu niệm, xây dựng
                Quỹ học bổng hỗ trợ học sinh và tổ chức những hoạt động kỷ niệm
                ý nghĩa, thiết thực.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-bold">
                <span className="rounded-full bg-white/15 px-5 py-2">
                  💚 Mỗi sự đóng góp là một lời tri ân.
                </span>
                <span className="rounded-full bg-white/15 px-5 py-2">
                  ❤️ Mỗi kỷ vật là một mảnh ghép ký ức.
                </span>
                <span className="rounded-full bg-white/15 px-5 py-2">
                  💙 Mỗi lần trở về là một lần viết tiếp câu chuyện Nguyễn Công
                  Trứ.
                </span>
              </div>
            </div>
          </Reveal>

          {/* Thông tin tiếp nhận đóng góp */}
          <Reveal variant="up" delay={180}>
            <div className="mt-12 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="tel:02838941546"
                className="btn-pop-soft flex items-center gap-3 rounded-2xl bg-white/10 p-5 backdrop-blur-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg">
                  📞
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-200">
                    Số điện thoại
                  </span>
                  <span className="block text-sm font-extrabold text-white">
                    (028) 38941546
                  </span>
                </span>
              </a>
              <a
                href="https://thptnguyencongtru.hcm.edu.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pop-soft flex items-center gap-3 rounded-2xl bg-white/10 p-5 backdrop-blur-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg">
                  🌐
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-200">
                    Website
                  </span>
                  <span className="block text-sm font-extrabold text-white">
                    thptnguyencongtru.hcm.edu.vn
                  </span>
                </span>
              </a>
              <div className="btn-pop-soft flex items-center gap-3 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg">
                  📍
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-200">
                    Địa chỉ
                  </span>
                  <span className="block text-sm font-extrabold text-white">
                    97 Quang Trung, Phường Thông Tây Hội, TP. Hồ Chí Minh
                  </span>
                </span>
              </div>
              <a
                href="mailto:thptnguyencongtru@hcm.edu.vn"
                className="btn-pop-soft flex items-center gap-3 rounded-2xl bg-white/10 p-5 backdrop-blur-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg">
                  📧
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-200">
                    Hộp thư tư liệu
                  </span>
                  <span className="block text-sm font-extrabold text-white">
                    thptnguyencongtru@hcm.edu.vn
                  </span>
                </span>
              </a>
              <div className="btn-pop-soft flex items-center gap-3 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg">
                  🏦
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-200">
                    Tài khoản ủng hộ - Vietcombank
                  </span>
                  <span className="block text-sm font-extrabold text-white">
                    1067816889 - Trường THPT Nguyễn Công Trứ
                  </span>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
