`loadkeys ru`

`setfont cyr-sun16`

`timedatectl set-ntp true`

1. Create EFI partition:
    - `fdisk -l` to find the designation for the HDD. (Most likely `/dev/nvme1n1`)
    - `fdisk /dev/nvme1n1`
        - g (to create a new partition table)
        - n (to create a new partition)
        - 1
        - enter
        - +300M
        - t
        - 1 (for EFI)
        - w

2. Create `/root` partition:
    - `fdisk /dev/nvme1n1`
        - n
        - 2
        - enter
        - +30G
        - w

3. Create the filesystems:
    - `mkfs.fat -F32 /dev/nvme1n1p1`
    - `mkfs.ext4 /dev/nvme1n1p2`

4. Create the `/root` directories:
    - `mount /dev/nvme1n1p2 /mnt`

5. Install Arch linux base packages:
    - `pacstrap -i /mnt base`

6. Generate the `/etc/fstab` file:
    - `genfstab -U -p /mnt >> /mnt/etc/fstab`

7. Chroot into installed system:
    - `arch-chroot /mnt`

8. Set the timezone:
    - `ln -sf /usr/share/zoneinfo/Asia/Yekaterinburg /etc/localtime`

9. Update the Hardware clock:
    - `hwclock --systohc`

10. `nano /etc/locale.gen`
    ```
    en_US.UTF-8 UTF-8
    ru_RU.UTF-8 UTF-8
    ```

11. `locale-gen`

12. `nano /etc/locale.conf`
    ```
    LANG=ru_RU.UTF-8
    ```

13. `nano /etc/vconsole.conf`
    ```
    KEYMAP=ru
    FONT=cyr-sun16
    ```

14. `nano /etc/hostname`
    ```
    HOSTNAME
    ```

15. `nano /etc/hosts`
    ```
    127.0.0.1 localhost
    ::1 localhost
    127.0.1.1 hostname.localdomain hostname
    ```

16. `passwd`

17. `pacman -S grub efibootmgr dhclient networkmanager kitty wget fastfetch`

18. Create EFI boot directory:
    - `mkdir /boot/EFI`
    - `mount /dev/nvme1n1p1 /boot/EFI`

19. Install GRUB on EFI mode:
    - `grub-install --target=x86_64-efi --bootloader-id=grub_uefi --recheck`

20. Setup locale for GRUB:
    - `cp /usr/share/locale/en\@quot/LC_MESSAGES/grub.mo /boot/grub/locale/en.mo`

21. Write GRUB config:
    - `grub-mkconfig -o /boot/grub/grub.cfg`

22. - exit
    - umount -R /mnt
    - reboot

23. `nano /etc/sudoers`
    ```
    %wheel ALL=ALL ALL
    ```

24. - `useradd -m -G wheel -s /bin/bash usem`
    - `passwd usem`


25. - `systemctl enable NetworkManager`
    - `systemctl start NetworkManager`

26. `sudo nano /etc/pacman.conf`
    ```
    multilib
    ```

27. `sudo pacman -Syu nvidia-dkms nvidia-utils lib32-nvidia-utils nvidia-settings vulkan-icd-loader lib32-vulkan-icd-loader lib32-opencl-nvidia opencl-nvidia libxnvctrl`
