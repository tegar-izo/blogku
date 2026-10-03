---
title: "memulai menginstall arch linux di laptop"
date: "2026-10-03"
excerpt: "ternyata menginstall archlinux tidak se-sulit dulu lagi, saat kita harus menginstall package satu persatu"
tags: "linux, archlinux, arch, tech, operating system, sistem operasi"
---
# memulai menginstall arch linux di laptop

Ternyata menginstall Arch Linux tidak sesulit dulu, ketika kita harus menginstall package satu per satu, apalagi tanpa tampilan visual atau GUI. Hanya bermodalkan terminal, kita harus melakukan berbagai konfigurasi secara manual. Langkah-langkahnya cukup banyak, dan walaupun Arch Wiki atau dokumentasi resmi Arch Linux sangat lengkap, proses tersebut tetap bisa menghabiskan banyak waktu hanya untuk melakukan instalasi.

Cara instalasi seperti itu mungkin cocok bagi beberapa orang yang memang menginginkan sistem operasi yang benar-benar disusun sendiri dan sudah cukup memahami Linux, terutama Arch Linux. Namun, bagi orang yang tidak ingin terlalu ribet dan hanya ingin menjalankan perintah seminimal mungkin, Arch Linux sekarang sudah menyediakan cara instalasi yang lebih praktis.

File ISO Arch Linux saat ini sudah menyertakan sebuah tools bernama `archinstall`. Ketika dijalankan, `archinstall` akan menampilkan aplikasi berbasis TUI atau Terminal User Interface. Tampilannya memang masih berada di dalam terminal, tetapi jauh lebih mudah dioperasikan dibandingkan harus memasukkan seluruh perintah instalasi secara manual.

Selain itu, sebagian besar konfigurasi sistem dapat dilakukan melalui menu tersebut. Kita juga bisa memilih filesystem, bootloader, network configuration, user account, kernel, dan desktop environment yang ingin digunakan.

Yang menarik, kita tetap mendapatkan konsep Arch Linux yang minimal dan fleksibel. Package yang dipasang juga dapat disesuaikan dengan kebutuhan. Desktop environment seperti GNOME, KDE Plasma, Xfce, dan beberapa pilihan lainnya tersedia melalui proses instalasi tersebut. Karena Arch Linux menggunakan model rolling release, package yang tersedia berasal dari repository Arch Linux dan umumnya mengikuti versi terbaru yang tersedia.

Jadi, `archinstall` bukan berarti Arch Linux berubah menjadi distro seperti Ubuntu atau Linux Mint yang sepenuhnya mengutamakan kemudahan. Kita tetap perlu memahami apa yang sedang kita konfigurasi. Hanya saja, proses instalasinya sekarang menjadi jauh lebih praktis.

## Proses Instalasi

### 1. Download file ISO Arch Linux

Pertama, kita perlu mengunduh file ISO Arch Linux dari website resminya.

[Download Arch Linux](https://archlinux.org/download/)

Scroll ke bawah sampai menemukan kumpulan server mirror dengan berbagai negara. Pilih mirror yang lokasinya relatif dekat dengan lokasi kamu agar proses download bisa lebih cepat.

Setelah memilih mirror, cari file ISO Arch Linux yang memiliki ekstensi `.iso`.

Untuk laptop atau PC pada umumnya yang menggunakan prosesor Intel atau AMD 64-bit, gunakan versi `x86_64`. Jangan memilih image untuk ARM atau arsitektur lainnya jika perangkat yang digunakan adalah PC/laptop biasa.

Selain file ISO, biasanya terdapat beberapa file lain seperti checksum dan signature. File tersebut dapat digunakan untuk memastikan file ISO yang kita download tidak rusak atau berubah selama proses download.

Setelah selesai, kita akan memiliki file seperti:

```text
archlinux-YYYY.MM.DD-x86_64.iso
```

Nama file dapat berbeda tergantung tanggal rilis ISO yang digunakan.

### 2. Membuat bootable USB

Setelah ISO selesai di-download, langkah berikutnya adalah membuat USB installer yang dapat digunakan untuk melakukan boot ke Arch Linux.

Kita membutuhkan flashdisk dengan kapasitas yang cukup untuk menampung file ISO. Perlu diperhatikan bahwa proses pembuatan bootable USB biasanya akan menghapus seluruh isi flashdisk tersebut, jadi pastikan tidak ada file penting di dalamnya.

Jika menggunakan Windows, kita bisa menggunakan aplikasi seperti Rufus atau Balena Etcher. Sedangkan jika menggunakan Linux, kita juga bisa menggunakan aplikasi seperti GNOME Disks atau perintah `dd` melalui terminal.

Setelah proses selesai, flashdisk tersebut dapat digunakan sebagai media instalasi Arch Linux.

### 3. Boot dari USB

Selanjutnya, restart laptop dan masuk ke Boot Menu atau BIOS/UEFI.

Tombol untuk masuk ke Boot Menu berbeda-beda tergantung perangkat. Pada beberapa laptop biasanya menggunakan `F12`, `F11`, `Esc`, atau tombol lainnya.

Pilih USB installer yang sudah dibuat sebelumnya.

Jika berhasil, kita akan masuk ke Arch Linux live environment.

Berbeda dengan installer distro seperti Ubuntu, kita tidak akan langsung melihat desktop grafis. Arch Linux akan membawa kita ke terminal.

Kurang lebih tampilannya akan seperti:

```text
root@archiso ~ #
```

Pada tahap ini, sebenarnya kita sudah menjalankan sistem Arch Linux secara langsung dari USB. Sistem tersebut belum terinstall ke SSD, sehingga perubahan yang kita lakukan belum menjadi instalasi permanen.

### 4. Memastikan koneksi internet

Sebelum menjalankan `archinstall`, kita perlu memastikan laptop sudah terhubung ke internet.

Jika menggunakan kabel Ethernet, biasanya koneksi dapat langsung digunakan.

Untuk Wi-Fi, Arch Linux menyediakan `iwctl` pada live environment.

Jalankan:

```bash
iwctl
```

Kemudian kita bisa melihat perangkat Wi-Fi yang tersedia:

```text
device list
```

Misalnya perangkat Wi-Fi kita bernama `wlan0`, kita dapat melihat jaringan yang tersedia dengan:

```text
station wlan0 get-networks
```

Kemudian hubungkan ke jaringan:

```text
station wlan0 connect NAMA_WIFI
```

Masukkan password Wi-Fi jika diminta.

Setelah terhubung, keluar dari `iwctl`:

```text
exit
```

Kemudian cek koneksi internet:

```bash
ping archlinux.org
```

Jika mendapatkan response seperti:

```text
64 bytes from ...
```

berarti koneksi internet sudah berjalan.

### 5. Menjalankan Archinstall

Setelah koneksi internet siap, sekarang kita bisa menjalankan installer yang menjadi inti dari proses instalasi kali ini.

Jalankan:

```bash
archinstall
```

Setelah beberapa saat, akan muncul tampilan TUI.

Di sinilah kita mulai melakukan konfigurasi instalasi Arch Linux.

Walaupun tampilannya menggunakan terminal, navigasinya cukup mudah. Kita dapat menggunakan tombol panah, Enter, dan beberapa tombol lainnya untuk memilih konfigurasi.

Secara umum, beberapa konfigurasi yang akan kita temui antara lain:

* Keyboard layout
* Mirror region
* Disk configuration
* Filesystem
* Bootloader
* Swap
* Hostname
* Root password
* User account
* Network configuration
* Kernel
* Additional packages
* Desktop environment
* Audio
* Time zone
* NTP
* Profile

### 6. Memilih keyboard layout

Konfigurasi pertama yang perlu diperhatikan adalah keyboard layout.

Untuk keyboard standar yang menggunakan layout QWERTY, biasanya kita dapat menggunakan:

```text
us
```

Jika keyboard yang digunakan memiliki layout berbeda, pilih sesuai perangkat masing-masing.

### 7. Memilih mirror region

Selanjutnya kita dapat memilih mirror yang akan digunakan untuk mengunduh package.

Karena Arch Linux menggunakan repository yang tersebar di berbagai negara, memilih mirror yang relatif dekat dapat membantu proses download menjadi lebih cepat.

Untuk pengguna di Indonesia, kita dapat memilih mirror Indonesia jika tersedia.

Namun, jika mirror tertentu sedang lambat atau bermasalah, kita dapat menggunakan mirror dari negara lain yang memiliki koneksi bagus.

### 8. Konfigurasi disk

Bagian ini merupakan salah satu bagian paling penting dalam proses instalasi.

Kita perlu menentukan SSD atau hard disk yang akan digunakan untuk Arch Linux.

`archinstall` menyediakan konfigurasi disk otomatis maupun konfigurasi manual.

Jika laptop memang ingin digunakan sepenuhnya untuk Arch Linux, konfigurasi otomatis dapat menjadi pilihan yang lebih sederhana.

Namun, jika laptop memiliki sistem operasi lain atau terdapat data penting di dalam disk, jangan terburu-buru memilih opsi yang menghapus seluruh disk.

Pastikan terlebih dahulu disk dan partisi yang dipilih sudah benar.

Misalnya:

```text
/dev/nvme0n1
```

atau:

```text
/dev/sda
```

Kesalahan pada tahap ini dapat menyebabkan data pada disk terhapus.

Karena itu, selalu lakukan backup terhadap data penting sebelum melakukan instalasi sistem operasi.

### 9. Memilih filesystem

Archinstall juga memungkinkan kita memilih filesystem yang akan digunakan.

Beberapa filesystem yang umum digunakan antara lain:

```text
ext4
btrfs
xfs
```

Untuk instalasi sederhana, `ext4` merupakan pilihan yang cukup umum dan mudah dipahami.

Jika ingin menggunakan fitur seperti snapshot dan konfigurasi yang lebih fleksibel, Btrfs juga dapat menjadi pilihan. Namun, penggunaan filesystem tersebut membutuhkan pemahaman tambahan mengenai subvolume, snapshot, dan mekanisme recovery.

Untuk instalasi pertama, tidak perlu memaksakan konfigurasi yang terlalu kompleks.

### 10. Memilih bootloader

Selanjutnya kita akan menentukan bootloader.

Bootloader bertugas melakukan proses awal ketika komputer dinyalakan dan memberikan pilihan sistem operasi yang dapat dijalankan.

Pada sistem UEFI modern, salah satu pilihan yang umum digunakan adalah GRUB.

Selain GRUB, Arch Linux juga dapat menggunakan bootloader lain seperti systemd-boot.

Jika ingin konfigurasi yang sederhana, pilih salah satu bootloader yang sesuai dengan kebutuhan dan dokumentasi perangkat yang digunakan.

### 11. Membuat user

Selanjutnya kita perlu membuat user yang akan digunakan untuk login ke sistem.

Biasanya kita akan diminta memasukkan username dan password.

Contohnya:

```text
Username: John
```

Kemudian tentukan password yang akan digunakan.

Jangan menggunakan password yang terlalu sederhana, terutama jika laptop nantinya digunakan untuk aktivitas yang berkaitan dengan jaringan atau cybersecurity.

Selain user biasa, `archinstall` juga menyediakan opsi untuk menentukan root password.

### 12. Memilih network configuration

Untuk penggunaan sehari-hari, kita membutuhkan network manager agar sistem dapat mengelola koneksi jaringan dengan mudah.

Salah satu pilihan yang umum digunakan adalah:

```text
NetworkManager
```

NetworkManager dapat digunakan untuk mengelola koneksi Ethernet maupun Wi-Fi.

Setelah sistem selesai diinstall dan masuk ke desktop environment, koneksi Wi-Fi dapat dikelola melalui GUI jika desktop environment yang digunakan menyediakan aplikasi jaringan.

### 13. Memilih kernel

Arch Linux menyediakan kernel Linux standar yang biasanya menjadi pilihan utama:

```text
linux
```

Selain itu terdapat pilihan seperti:

```text
linux-lts
```

Kernel LTS atau Long Term Support memiliki siklus dukungan yang lebih panjang dan sering digunakan ketika stabilitas kernel menjadi prioritas.

Untuk instalasi standar, `linux` sudah cukup.

### 14. Memilih desktop environment

Nah, ini salah satu bagian yang cukup menarik.

Jika kita melakukan instalasi Arch Linux secara manual, kita perlu menginstall dan mengkonfigurasi desktop environment sendiri.

Dengan `archinstall`, proses tersebut menjadi jauh lebih sederhana.

Kita dapat memilih beberapa desktop environment yang tersedia, misalnya:

```text
GNOME
KDE Plasma
Xfce
Cinnamon
MATE
LXDE
LXQt
```

dan beberapa pilihan lainnya tergantung versi installer dan repository yang tersedia.

Jika laptop memiliki spesifikasi yang cukup seperti RAM 16 GB dan prosesor Ryzen 7, desktop environment modern seperti GNOME atau KDE Plasma dapat digunakan dengan nyaman.

Namun, pilihan desktop environment kembali kepada kebutuhan dan preferensi masing-masing.

GNOME memiliki tampilan yang sederhana dan terintegrasi, sedangkan KDE Plasma memberikan banyak pilihan untuk melakukan kustomisasi.

Xfce lebih sederhana dan cenderung menggunakan resource yang lebih sedikit.

### 15. Memilih audio

Untuk audio, kita dapat menggunakan PipeWire.

PipeWire merupakan sistem multimedia modern yang digunakan oleh banyak distribusi Linux saat ini.

Jika tersedia pilihan:

```text
pipewire
```

kita dapat memilihnya untuk penggunaan audio sehari-hari.

### 16. Mengatur timezone

Selanjutnya kita menentukan timezone.

Karena saya berada di Indonesia, timezone yang digunakan dapat disesuaikan dengan wilayah masing-masing.

Contohnya untuk WIB:

```text
Asia/Jakarta
```

Untuk WITA:

```text
Asia/Makassar
```

Dan untuk WIT:

```text
Asia/Jayapura
```

Pengaturan timezone penting agar waktu sistem sesuai dengan lokasi kita.

### 17. Menginstall sistem

Setelah seluruh konfigurasi selesai, `archinstall` akan menampilkan ringkasan konfigurasi yang telah kita pilih.

Pada tahap ini sebaiknya jangan langsung menekan tombol install.

Periksa kembali beberapa bagian penting:

```text
Disk
Filesystem
Bootloader
Username
Timezone
Network
Kernel
Desktop Environment
```

Terutama bagian disk.

Jika semua konfigurasi sudah benar, kita dapat melanjutkan proses instalasi.

Archinstall kemudian akan mulai melakukan proses instalasi secara otomatis.

Package akan di-download dari repository Arch Linux dan kemudian dipasang ke disk yang telah dipilih.

Lamanya proses instalasi bergantung pada kecepatan internet, performa SSD, mirror yang digunakan, dan jumlah package yang perlu di-download.

### 18. Restart ke sistem Arch Linux

Jika proses instalasi telah selesai, `archinstall` biasanya akan memberikan pilihan untuk melakukan reboot.

Sebelum restart, cabut flashdisk installer agar laptop tidak kembali boot ke Arch Linux live environment.

Kemudian restart:

```bash
reboot
```

Jika semuanya berjalan dengan baik, laptop akan masuk ke bootloader dan kemudian menjalankan Arch Linux yang baru saja kita install.

Jika memilih desktop environment seperti GNOME atau KDE Plasma, kita akan sampai ke layar login grafis.

Setelah login, akhirnya kita sudah memiliki sistem Arch Linux yang terinstall di laptop.

## Setelah Instalasi

Instalasi sebenarnya bukan akhir dari proses.

Setelah berhasil masuk ke Arch Linux, ada beberapa hal yang sebaiknya dilakukan.

Pertama, update sistem:

```bash
sudo pacman -Syu
```

Arch Linux menggunakan rolling release, sehingga update sistem merupakan sesuatu yang cukup penting untuk dilakukan secara rutin.

Kemudian kita dapat menginstall beberapa package tambahan yang dibutuhkan untuk aktivitas sehari-hari.

Misalnya:

Untuk developer, kita mungkin juga membutuhkan:

```bash
sudo pacman -S base-devel
```

Kemudian tools lain dapat diinstall sesuai kebutuhan.

Misalnya untuk JavaScript/Node.js:

```bash
sudo pacman -S nodejs npm
```

Untuk Python:

```bash
sudo pacman -S python
```

Dan untuk Git:

```bash
sudo pacman -S git
```

Dengan konsep Arch Linux yang minimal, kita tidak perlu menginstall terlalu banyak software yang sebenarnya tidak digunakan.

## Kesimpulan

Arch Linux memang terkenal sebagai distro yang memberikan kontrol sangat besar kepada penggunanya. Dulu, proses instalasinya identik dengan terminal, konfigurasi manual, dan membaca dokumentasi dalam jumlah yang cukup banyak.

Sekarang, dengan adanya `archinstall`, proses tersebut menjadi lebih mudah diakses, terutama bagi pengguna yang baru ingin mencoba Arch Linux tetapi belum siap melakukan instalasi sepenuhnya secara manual.

Namun, kemudahan `archinstall` bukan berarti kita tidak perlu memahami apa yang dilakukan.

Justru menurut saya, `archinstall` dapat menjadi titik awal yang cukup baik untuk mengenal Arch Linux. Kita bisa mendapatkan sistem yang sudah berjalan terlebih dahulu, kemudian mempelajari bagaimana sistem tersebut bekerja sedikit demi sedikit.

Setelah terbiasa, kita dapat mulai memahami hal-hal seperti partitioning, bootloader, systemd, package management, filesystem, networking, desktop environment, dan berbagai komponen Linux lainnya.

Pada akhirnya, kita tidak hanya sekadar "berhasil menginstall Arch Linux", tetapi juga mulai memahami bagaimana sebuah sistem operasi Linux dibangun dan bekerja di balik layar.

Dan mungkin itulah bagian paling menarik dari menggunakan Arch Linux: setelah instalasi selesai, proses belajarnya justru baru dimulai.
