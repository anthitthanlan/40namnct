# Server Deployment Constraints

**Mô tả:** Quy tắc bắt buộc khi cần cập nhật code lên Server Production (`161.118.210.69`).

## 1. Không tự chạy lệnh SSH / SCP
- KHÔNG BAO GIỜ tự dùng terminal của agent để chạy `ssh` hay `scp` vào server `partner@161.118.210.69` vì Agent không có mật khẩu, tiến trình sẽ bị treo.

## 2. Luồng thao tác đúng
Khi cần cập nhật code hoặc tương tác với Server Production, hãy thực hiện theo trình tự sau:
1. Cập nhật code ở thư mục dự án cục bộ (local).
2. Viết sẵn lệnh `scp` dưới dạng code block để Người dùng (USER) tự copy và chạy. 
   - Ví dụ: `scp backend-app/routers/media.py partner@161.118.210.69:~/app/routers/media.py`
3. Cung cấp sẵn các lệnh để khởi động lại (restart) Backend bằng `uvicorn` cho Người dùng tự chạy:
   - Dừng tiến trình cũ: `pkill -f "uvicorn app.main:app"`
   - Chạy tiến trình mới ngầm: `nohup ~/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3000 --env-file app/.env > backend.log 2>&1 &`
