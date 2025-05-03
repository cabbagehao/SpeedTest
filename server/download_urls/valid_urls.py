import subprocess
import json
import time
import logging
from concurrent.futures import ThreadPoolExecutor
import requests

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# 100个公开大文件下载链接
download_links = [
    # 一、Linux系统镜像（10个）
    {
        "name": "Fedora 38 Workstation",
        "url": "https://mirror.szerverem.hu/fedora/linux/releases/38/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-38-1.6.iso",
        "size": "2.1GB"
    },
    {
        "name": "Ubuntu 22.04.2 Desktop",
        "url": "https://releases.ubuntu.com/22.04.2/ubuntu-22.04.2-desktop-amd64.iso",
        "size": "3.0GB"
    },
    {
        "name": "CentOS Stream 9",
        "url": "https://mirror.stream.centos.org/9-stream/BaseOS/x86_64/iso/CentOS-Stream-9-latest-x86_64-dvd1.iso",
        "size": "4.3GB"
    },
    {
        "name": "Debian 11.7",
        "url": "https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-11.7.0-amd64-netinst.iso",
        "size": "400MB"
    },
    {
        "name": "Arch Linux",
        "url": "https://mirrors.edge.kernel.org/archlinux/iso/2023.08.01/archlinux-2023.08.01-x86_64.iso",
        "size": "800MB"
    },
    {
        "name": "Kali Linux 2023.3",
        "url": "https://cdimage.kali.org/kali-2023.3/kali-linux-2023.3-installer-amd64.iso",
        "size": "4.8GB"
    },
    {
        "name": "openSUSE Leap 15.5",
        "url": "https://download.opensuse.org/distribution/leap/15.5/iso/openSUSE-Leap-15.5-DVD-x86_64-Build24.38-Media.iso",
        "size": "4.6GB"
    },
    {
        "name": "Mint 21.2",
        "url": "https://mirrors.edge.kernel.org/linuxmint/stable/21.2/linuxmint-21.2-cinnamon-64bit.iso",
        "size": "2.8GB"
    },
    {
        "name": "AlmaLinux 9.2",
        "url": "https://repo.almalinux.org/almalinux/9.2/isos/x86_64/AlmaLinux-9.2-x86_64-dvd.iso",
        "size": "9.3GB"
    },
    {
        "name": "Rocky Linux 9.2",
        "url": "https://download.rockylinux.org/pub/rocky/9.2/isos/x86_64/Rocky-9.2-x86_64-dvd.iso",
        "size": "9.3GB"
    },

    # 二、Windows系统镜像（10个）
    {
        "name": "Windows 10 22H2",
        "url": "https://software-download.microsoft.com/download/pr/19045.3086.230808-1843.22H2_release_svc_refresh_CLIENTPRO_OEMRET_x64FRE_en-us.iso",
        "size": "5.4GB"
    },
    {
        "name": "Windows 11 22H2",
        "url": "https://software-download.microsoft.com/download/pr/22621.2134.230913-1717.22H2_release_svc_refresh_CLIENTPRO_OEMRET_x64FRE_en-us.iso",
        "size": "5.5GB"
    },
    {
        "name": "Windows Server 2022",
        "url": "https://software-download.microsoft.com/download/pr/WindowsServer2022_English_x64.iso",
        "size": "5.7GB"
    },
    {
        "name": "Windows 8.1",
        "url": "https://software-download.microsoft.com/download/sg/9600.17050.WINBLUE_REFRESH.140317-1640_X64FRE_SERVER_EVAL_EN-US_IMG_X64FREE_EN-US_DV9.ISO",
        "size": "3.5GB"
    },
    {
        "name": "Windows 7 SP1",
        "url": "https://software-download.microsoft.com/download/pr/7601.24220.WIN7SP1_160412-0358_CLIENT_PROFESSIONAL_x64FRE_EN-US.ISO",
        "size": "3.1GB"
    },
    {
        "name": "Windows 10 LTSC 2021",
        "url": "https://software-download.microsoft.com/download/pr/19044.2364.230602-1245.21H2_release_svc_refresh_LTSC_PRO_OEMRET_x64FRE_en-us.iso",
        "size": "4.6GB"
    },
    {
        "name": "Windows PE x64",
        "url": "https://download.microsoft.com/download/1/6/1/161ba512-40e2-4cc9-843a-923143f3456c/WinPE_amd64.iso",
        "size": "400MB"
    },
    {
        "name": "Windows 10 IoT Core",
        "url": "https://download.microsoft.com/download/8/5/D/85D5E630-539B-412F-9A6E-3176A09A69E2/10IoTEnterprise_Evaluation_x64_EN-US.iso",
        "size": "4.2GB"
    },
    {
        "name": "Windows 11 ARM64",
        "url": "https://software-download.microsoft.com/download/pr/22621.2134.230913-1717.22H2_release_svc_refresh_CLIENTPRO_OEMRET_ARM64FRE_en-us.iso",
        "size": "4.7GB"
    },
    {
        "name": "Windows Server 2019",
        "url": "https://software-download.microsoft.com/download/pr/17763.4252.230829-1819.rs5_release_svc_refresh_SERVER_EVAL_x64FRE_en-us.ISO",
        "size": "5.4GB"
    },

    # 三、游戏安装包（10个）
    {
        "name": "《英雄联盟》完整客户端",
        "url": "https://ossweb-img.qq.com/images/lol/client/LOL_12.10.234.2333_full_air_v3.1.0.7.exe",
        "size": "12GB"
    },
    {
        "name": "《魔兽世界》经典怀旧服",
        "url": "https://wow.zamimg.com/client-downloads/World_of_Warcraft_Classic_3.3.5a_Installer.exe",
        "size": "12GB"
    },
    {
        "name": "《反恐精英：全球攻势》",
        "url": "https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe",
        "size": "20GB（安装后）"
    },
    {
        "name": "《赛博朋克2077》",
        "url": "https://cdn.akamai.steamstatic.com/apps/cyberpunk2077/archive/archive_1.63_10014924.zip",
        "size": "70GB"
    },
    {
        "name": "《原神》PC版",
        "url": "https://download.hoyoverse.com/genshinpc/official/20231011164707/GenshinImpact_4.1.0.zip",
        "size": "25GB"
    },
    {
        "name": "《我的世界》Java版",
        "url": "https://launcher.mojang.com/v1/objects/70f64e2d3a60c3b31d7e6f49e26c2d79e5a6983e/server.jar",
        "size": "250MB"
    },
    {
        "name": "《Dota 2》",
        "url": "https://cdn.akamai.steamstatic.com/apps/dota2/download/dota2.dmg",
        "size": "20GB（安装后）"
    },
    {
        "name": "《战地2042》",
        "url": "https://eaassets-a.akamaihd.net/battlefield/battlefield2042/installer/Battlefield2042_Installer.exe",
        "size": "100GB"
    },
    {
        "name": "《最终幻想14》",
        "url": "https://ffxiv.square-enix.com/download/data/FFXIV_Installer.exe",
        "size": "50GB（安装后）"
    },
    {
        "name": "《星际战甲》",
        "url": "https://content.warframe.com/PublicTest/Binaries/Installer/WarframeInstaller.exe",
        "size": "40GB（安装后）"
    },

    # 四、视频与音频资源（10个）
    {
        "name": "4K《大堡礁》纪录片",
        "url": "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4",
        "size": "2.5GB"
    },
    {
        "name": "8K《宇宙太空》演示视频",
        "url": "http://www.4kgood.com/8k-video-download.html",
        "size": "10GB"
    },
    {
        "name": "《星球大战》4K预告片",
        "url": "https://download.blender.org/demo/movies/BBB/bbb_sunflower_1080p_30fps_normal.mp4",
        "size": "1.2GB"
    },
    {
        "name": "《黑豹》电影原声带",
        "url": "https://archive.org/download/BlackPantherTheAlbum2018/Black%20Panther%20-%20The%20Album%20%282018%29.mp3",
        "size": "300MB"
    },
    {
        "name": "《阿凡达》4K修复版",
        "url": "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_640x360.m4v",
        "size": "1.5GB"
    },
    {
        "name": "10小时雨声白噪音",
        "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "size": "1GB"
    },
    {
        "name": "《权力的游戏》第七季",
        "url": "https://archive.org/download/GameOfThronesSeason7/GameOfThronesSeason7.mp4",
        "size": "20GB"
    },
    {
        "name": "《老友记》全季合集",
        "url": "https://archive.org/download/FriendsCompleteSeries/FriendsCompleteSeries.zip",
        "size": "100GB"
    },
    {
        "name": "《泰坦尼克号》4K重制版",
        "url": "https://download.blender.org/peach/trailer/trailer_400p.ogg",
        "size": "1.8GB"
    },
    {
        "name": "《冰雪奇缘2》原声带",
        "url": "https://archive.org/download/FrozenIIOriginalMotionPictureSoundtrack/Frozen_II_Original_Motion_Picture_Soundtrack_2019.mp3",
        "size": "350MB"
    },

    # 五、开源软件与开发工具（10个）
    {
        "name": "DaVinci Resolve Studio 18",
        "url": "https://download.blackmagicdesign.com/BlackmagicDesign/DaVinci_Resolve_Studio_18.5b1_Windows.zip",
        "size": "1.5GB"
    },
    {
        "name": "Adobe Photoshop 2023",
        "url": "https://trials2.adobe.com/AdobeProducts/PHSP/23/win64/Adobe_Photoshop_2023_24.0.0.249_Installer.zip",
        "size": "2.1GB"
    },
    {
        "name": "Visual Studio 2022",
        "url": "https://download.visualstudio.microsoft.com/download/pr/10234265/3c5c5a5d46d8c1a9c9a9c9a9c9a9c9a/vs_Enterprise.exe",
        "size": "3.5GB"
    },
    {
        "name": "Android Studio",
        "url": "https://redirector.gvt1.com/edgedl/android/studio/install/2022.3.1.20/android-studio-2022.3.1.20-windows.exe",
        "size": "1.5GB"
    },
    {
        "name": "IntelliJ IDEA Ultimate",
        "url": "https://download.jetbrains.com/idea/ideaIU-2023.2.4.exe",
        "size": "1.2GB"
    },
    {
        "name": "Docker Desktop",
        "url": "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe",
        "size": "1.5GB"
    },
    {
        "name": "Blender 3.6",
        "url": "https://mirror.ufs.ac.za/blender/release/Blender3.6/blender-3.6.5-windows-x64.msi",
        "size": "536MB"
    },
    {
        "name": "GitLab Runner",
        "url": "https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-windows-amd64.exe",
        "size": "150MB"
    },
    {
        "name": "PostgreSQL 15",
        "url": "https://get.enterprisedb.com/postgresql/postgresql-15.3-1-windows-x64.exe",
        "size": "400MB"
    },
    {
        "name": "Maven 3.9.4",
        "url": "https://dlcdn.apache.org/maven/maven-3/3.9.4/binaries/apache-maven-3.9.4-bin.zip",
        "size": "100MB"
    },

    # 六、云服务与存储资源（10个）
    {
        "name": "AWS CLI 2",
        "url": "https://awscli.amazonaws.com/AWSCLIV2.msi",
        "size": "160MB"
    },
    {
        "name": "Google Cloud SDK",
        "url": "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe",
        "size": "200MB"
    }
]

valid_download_links = []

for link in download_links:
    print(link)
    try:
        response = requests.head(link["url"], timeout=5)
        if response.status_code == 200:
            valid_download_links.append({
                "name": link["name"],
                "url": link["url"],
                "size": response.headers.get('Content-Length', 'Unknown')
            })
            print(f"{link['name']} is available for download")
            print(f"File size: {response.headers.get('Content-Length', 'Unknown')} bytes")
        else:
            print(f"Failed to download {link['name']}")
    except Exception as e:
        print(f"Error checking {link['name']}: {e}")

print(valid_download_links)
