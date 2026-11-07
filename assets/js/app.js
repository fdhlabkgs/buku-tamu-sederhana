let daftarTamu = [];

// Sanitasi teks untuk mencegah celah XSS saat merender ke tabel
function esc(teks) {
  const div = document.createElement("div");
  div.textContent = String(teks ?? "");
  return div.innerHTML;
}

// Menampilkan pesan status (mendukung id="form-status" maupun "form-status")
function tampilkanStatus(pesan, tipe = "") {
  const statusEl = document.getElementById("form-status");
  if (!statusEl) return;

  statusEl.textContent = pesan;
  statusEl.className = "status-msg " + tipe;
}

// Merender isi array daftarTamu ke dalam <tbody id="tabel-body">
function renderTabel() {
  const tbody = document.getElementById("tabel-body");
  const jumlahEl = document.getElementById("jumlah-tamu");

  if (!tbody) return;
  if (jumlahEl) jumlahEl.textContent = daftarTamu.length;

  if (daftarTamu.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center;">Belum ada data tamu kondangan.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = daftarTamu
    .map(function (item, index) {
      return `
        <tr>
          <td>
            <strong>${esc(item.nama)}</strong><br />
            <small>${esc(item.notelpon)}</small>
          </td>
          <td>${esc(item.pesan)}</td>
          <td>
            <button type="button" class="btn-edit" data-index="${index}">Edit</button>
            <button type="button" class="btn-hapus" data-index="${index}">Hapus</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Mengembalikan form ke mode Tambah Baru
function resetForm() {
  const form = document.getElementById("form-tamu");
  const inputId = document.getElementById("tamu-id");
  const btnSubmit = document.getElementById("btn-submit");
  const btnBatal = document.getElementById("btn-batal");

  if (form) form.reset();
  if (inputId) inputId.value = "";
  if (btnSubmit) btnSubmit.textContent = "Kirim";
  if (btnBatal) btnBatal.hidden = true;
}

// Membaca data awal dari berkas data/tamu.json
async function muatData() {
  try {
    const respons = await fetch("data/tamu.json");
    if (!respons.ok) throw new Error("Gagal memuat data/tamu.json");
    const data = await respons.json();

    // Mengambil array dari key "buku-tamu" sesuai struktur JSON Anda
    daftarTamu = data["buku-tamu"] || [];
    renderTabel();
  } catch (err) {
    const tbody = document.getElementById("tabel-body");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center;">Gagal memuat data JSON.</td>
        </tr>
      `;
    }
    console.error(err);
  }
}

// Inisialisasi event listener saat halaman dimuat
function mulai() {
  const tahunEl = document.getElementById("tahun");
  if (tahunEl) tahunEl.textContent = new Date().getFullYear() + ". ";

  const form = document.getElementById("form-tamu");
  const btnBatal = document.getElementById("btn-batal");
  const tbody = document.getElementById("tabel-body");

  // 1. Proses Submit Form (Tambah Baru & Simpan Edit)
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const idEdit = document.getElementById("tamu-id").value;
      const nama = document.getElementById("nama").value.trim();
      const notelpon = document.getElementById("notelpon").value.trim();
      const pesan = document.getElementById("pesan").value.trim();

      // Validasi input wajib
      if (nama === "" || notelpon === "" || pesan === "") {
        tampilkanStatus("Nama, No Telpon, dan Pesan wajib diisi!", "error");
        return;
      }

      if (!/^[0-9+\-\s]{8,15}$/.test(notelpon)) {
        tampilkanStatus("No Telpon harus berupa angka (8-15 digit)!", "error");
        return;
      }

      const dataInput = {
        nama: nama,
        notelpon: notelpon,
        pesan: pesan,
      };

      // Cek apakah sedang mode Tambah Baru (kosong) atau mode Edit (berisi index)
      if (idEdit === "") {
        daftarTamu.unshift(dataInput);
        tampilkanStatus("Data tamu berhasil ditambahkan!", "success");
      } else {
        const idx = Number(idEdit);
        if (daftarTamu[idx]) {
          daftarTamu[idx] = dataInput;
          tampilkanStatus("Data tamu berhasil diperbarui!", "success");
        }
      }

      resetForm();
      renderTabel();
    });
  }

  // 2. Tombol Batal Edit
  if (btnBatal) {
    btnBatal.addEventListener("click", function () {
      resetForm();
      tampilkanStatus("");
    });
  }

  // 3. Aksi Klik Edit dan Hapus di dalam Tabel (Event Delegation)
  if (tbody) {
    tbody.addEventListener("click", function (e) {
      const btnEdit = e.target.closest(".btn-edit");
      const btnHapus = e.target.closest(".btn-hapus");

      // Jika klik tombol Edit
      if (btnEdit) {
        const idx = Number(btnEdit.dataset.index);
        const item = daftarTamu[idx];
        if (!item) return;

        document.getElementById("tamu-id").value = idx;
        document.getElementById("nama").value = item.nama;
        document.getElementById("notelpon").value = item.notelpon;
        document.getElementById("pesan").value = item.pesan;

        document.getElementById("btn-submit").textContent = "Simpan Perubahan";
        document.getElementById("btn-batal").hidden = false;
        tampilkanStatus("Mode ubah data untuk: " + item.nama);
      }

      // Jika klik tombol Hapus
      if (btnHapus) {
        const idx = Number(btnHapus.dataset.index);
        const item = daftarTamu[idx];
        if (!item) return;

        daftarTamu.splice(idx, 1);
        resetForm();
        renderTabel();
        tampilkanStatus("Data tamu berhasil dihapus.", "success");
      }
    });
  }

  muatData();
}

mulai();
