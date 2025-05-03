import requests
import time
import threading
from concurrent.futures import ThreadPoolExecutor

download_links = [{
  "name": "Fedora 38 Workstation",
  "url": "https://mirror.szerverem.hu/fedora/linux/releases/38/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-38-1.6.iso",
  "size": "2099451904"
}, {
  "name": "CentOS Stream 9",
  "url": "https://mirror.stream.centos.org/9-stream/BaseOS/x86_64/iso/CentOS-Stream-9-latest-x86_64-dvd1.iso",
  "size": "12876316672"
}, {
  "name": "CentOS Stream 9 x86_64",
  "url": "https://mirror.stream.centos.org/9-stream/BaseOS/x86_64/iso/CentOS-Stream-9-20250428.0-x86_64-dvd1.iso",
  "size": "12876316672"
}, {
  "name": "Mint 21.2",
  "url": "https://mirrors.edge.kernel.org/linuxmint/stable/21.2/linuxmint-21.2-cinnamon-64bit.iso",
  "size": "3026413568"
}, {
  "name": "《反恐精英：全球攻势》",
  "url": "https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe",
  "size": "2380800"
}, {
  "name": "4K《大堡礁》纪录片",
  "url": "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4",
  "size": "1046987"
}, {
  "name": "《阿凡达》4K修复版",
  "url": "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_640x360.m4v",
  "size": "121283919"
}, {
  "name": "10小时雨声白噪音",
  "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "size": "8945229"
}, {
  "name": "《泰坦尼克号》4K重制版",
  "url": "https://download.blender.org/peach/trailer/trailer_400p.ogg",
  "size": "4360399"
}, {
  "name": "GitLab Runner",
  "url": "https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-windows-amd64.exe",
  "size": "111411464"
}, {
  "name": "PostgreSQL 15",
  "url": "https://get.enterprisedb.com/postgresql/postgresql-15.3-1-windows-x64.exe",
  "size": "336432992"
}, {
  "name": "Maven 3.9.4",
  "url": "https://dlcdn.apache.org/maven/maven-3/3.9.4/binaries/apache-maven-3.9.4-bin.zip",
  "size": "9439276"
}, {
  "name": "AWS CLI 2",
  "url": "https://awscli.amazonaws.com/AWSCLIV2.msi",
  "size": "43864064"
}, {
  "name": "Google Cloud SDK",
  "url": "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe",
  "size": "267328"
}]

def test_single_download_speed():
    """
    测试每个URL单独下载的速度，每个URL下载5秒
    """
    results = []
    
    for link in download_links:
        name = link["name"]
        url = link["url"]
        print(f"正在测试 {name} 的下载速度...")
        
        start_time = time.time()
        downloaded_bytes = 0
        
        try:
            # 使用流式请求下载
            with requests.get(url, stream=True, timeout=10) as response:
                response.raise_for_status()
                end_time = start_time + 5  # 下载5秒
                
                for chunk in response.iter_content(chunk_size=8192):
                    if time.time() >= end_time:
                        break
                    downloaded_bytes += len(chunk)
        except Exception as e:
            print(f"下载 {name} 时出错: {e}")
            continue
        
        # 计算下载速度
        duration = time.time() - start_time
        speed_mbps = (downloaded_bytes * 8) / (duration * 1000000)  # 转换为Mbps
        
        results.append({
            "name": name,
            "downloaded_bytes": downloaded_bytes,
            "duration": duration,
            "speed_mbps": speed_mbps
        })
        
        print(f"{name} 下载速度: {speed_mbps:.2f} Mbps")
    
    return results

def test_parallel_download_speed():
    """
    测试所有URL并行下载的速度，持续显示下载速度，直到用户手动停止
    使用最近10秒的数据计算平滑下载速度
    """
    download_data = {}
    speed_history = {}
    stop_event = threading.Event()
    
    # 初始化下载数据
    for link in download_links:
        name = link["name"]
        download_data[name] = {
            "bytes": 0,
            "last_bytes": 0,
            "error": None,
            "speed_history": []  # 存储最近10秒的速度数据
        }
    
    def download_url(link):
        name = link["name"]
        url = link["url"]
        
        try:
            with requests.get(url, stream=True, timeout=15) as response:
                response.raise_for_status()
                
                for chunk in response.iter_content(chunk_size=8192):
                    if stop_event.is_set():
                        break
                    with threading.Lock():
                        download_data[name]["bytes"] += len(chunk)
        except Exception as e:
            with threading.Lock():
                download_data[name]["error"] = str(e)
    
    # 计算并显示速度的函数
    def calculate_and_display_speeds():
        while not stop_event.is_set():
            time.sleep(1)  # 每秒更新一次
            
            current_time = time.time()
            total_current_speed = 0
            
            # 计算每个链接的当前速度
            for name, data in download_data.items():
                with threading.Lock():
                    current_bytes = data["bytes"]
                    last_bytes = data["last_bytes"]
                    bytes_diff = current_bytes - last_bytes
                    data["last_bytes"] = current_bytes
                
                # 计算当前速度 (Mbps)
                current_speed = (bytes_diff * 8) / 1000000  # Mbps/s
                
                # 更新速度历史
                data["speed_history"].append((current_time, current_speed))
                
                # 只保留最近10秒的数据
                while data["speed_history"] and current_time - data["speed_history"][0][0] > 10:
                    data["speed_history"].pop(0)
                
                # 计算平滑速度 (使用最近10秒数据的加权平均)
                if data["speed_history"]:
                    weights = [(current_time - t) / 10 for t, _ in data["speed_history"]]
                    total_weight = sum(weights)
                    if total_weight > 0:
                        smooth_speed = sum(w * s for (_, s), w in zip(data["speed_history"], weights)) / total_weight
                    else:
                        smooth_speed = current_speed
                else:
                    smooth_speed = current_speed
                
                total_current_speed += smooth_speed
                
                # 打印每个链接的速度
                if data["error"]:
                    print(f"{name}: 错误 - {data['error']}")
                else:
                    print(f"{name}: {smooth_speed:.2f} Mbps")
            
            # 打印总速度
            print(f"\n总下载速度: {total_current_speed:.2f} Mbps")
            print("-" * 50)
    
    # 启动所有下载线程
    print("开始并行下载测试... 按 Ctrl+C 停止")
    
    with ThreadPoolExecutor(max_workers=min(len(download_links), 10)) as executor:
        # 启动速度计算和显示线程
        speed_thread = threading.Thread(target=calculate_and_display_speeds)
        speed_thread.daemon = True
        speed_thread.start()
        
        # 启动下载线程
        futures = [executor.submit(download_url, link) for link in download_links]
        
        try:
            # 等待所有下载完成或用户手动停止
            for future in futures:
                future.result()
        except KeyboardInterrupt:
            print("\n用户停止下载")
        finally:
            stop_event.set()
            
    # 计算最终结果
    total_bytes = sum(data["bytes"] for data in download_data.values())
    results = {
        "total_bytes": total_bytes,
        "individual_results": {
            name: {
                "bytes": data["bytes"],
                "error": data["error"]
            } for name, data in download_data.items()
        }
    }
    
    return results

if __name__ == "__main__":
    # print("===== 单独下载测试 =====")
    # single_results = test_single_download_speed()
    
    print("\n===== 并行下载测试 =====")
    parallel_results = test_parallel_download_speed()


