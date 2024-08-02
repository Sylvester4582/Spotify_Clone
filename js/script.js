console.log('Script is loaded...')

function formatTime(seconds) {
    // Calculate the minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Format the minutes and seconds to always have two digits
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

    // Combine the formatted minutes and seconds
    return `${formattedMinutes}:${formattedSeconds}`;
}

let currentSong = new Audio();
let currentFolder;
let songs;
let folders;

async function getFolder() {
    let a = await fetch('/Songs/');
    let response = await a.text();

    let div = document.createElement('div');
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    let folder = [];
    for (let i = 0; i < as.length; i++) {
        const element = as[i];
        if (element.href.startsWith(location.origin + "/Songs") && !element.href.includes('.htaccess')) {
            // Correcting the split logic
            let pathParts = element.href.split("/Songs/");
            if (pathParts.length > 1) {
                folder.push(decodeURIComponent(pathParts[1]).replace('/', '')); // Decoding URI component
            }
        }
    }
    return folder;
}

async function songsUpdate(play, songOL, pause = false) {
    // updates the library
    songOL.innerHTML = '';
    for (const song of songs) {
        let imgSrc = `/Songs/${currentFolder}/images/` + decodeURI(song).replace(".mp3", ".jpg");
        let imgElement = new Image();

        imgElement.src = imgSrc;
        imgElement.onerror = function () {
            this.src = '/symbols/songImg.svg';
        };

        songOL.innerHTML = songOL.innerHTML + `<li>
                            <div class="music-box"> 
                            <img class='song-img li-img' src="${imgElement.src}" alt="Music Img" onerror="this.onerror=null; this.src='/symbols/songImg.svg';">
                                <div class="info">${decodeURI(song).replace(".mp3", "")}</div> 
                            </div>
                            <div class="play-now"><span>Play Now</span> <img src="/symbols/play-2.svg" alt=""></div>
                        </li> `;
    }

    playMusic(decodeURI(songs[0]), pause);
    if (!pause) {
        play.src = '/symbols/pause.svg'
    }

    // adds event listener to library elements
    Array.from(document.querySelector(".song-list").getElementsByTagName('li')).forEach(e => {
        e.addEventListener('click', element => {
            playMusic(e.querySelector(".info").innerHTML)
            play.src = '/symbols/pause.svg'
        })
        e.addEventListener('mouseover', element => {
            e.getElementsByTagName('img')[1].src = '/symbols/play-2_hov.svg';
            if (e.getElementsByTagName('img')[0].src.endsWith('/symbols/songImg.svg')) {
                e.getElementsByTagName('img')[0].src = '/symbols/songImg_hov.svg';
            }
        })

        e.addEventListener('mouseout', element => {
            e.getElementsByTagName('img')[1].src = '/symbols/play-2.svg';
            if (e.getElementsByTagName('img')[0].src.endsWith('/symbols/songImg_hov.svg')) {
                e.getElementsByTagName('img')[0].src = '/symbols/songImg.svg';
            }
        })
    })
}


async function getSongs(folder) {
    currentFolder = folder;
    let a = await fetch(`/Songs/${folder}/`);
    let response = await a.text();

    let div = document.createElement('div');
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    let songs = [];

    for (let i = 0; i < as.length; i++) {
        const element = as[i];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${encodeURI(folder)}/`)[1]);
        }
    }

    return songs;
}

const playMusic = (track, pause = false) => {
    if (track.endsWith('.mp3')) {
        currentSong.src = `/Songs/${currentFolder}/` + track;
    }
    else {
        currentSong.src = `/Songs/${currentFolder}/` + track + ".mp3";
    }
    if (!pause) {
        currentSong.play();
    }
    if (!decodeURI(track).endsWith('mp3')) {
        track = track + '.mp3';
    }

    let imgSrc = `/Songs/${currentFolder}/images/` + decodeURI(track).replace(".mp3", ".jpg");
    let imgElement = new Image();

    imgElement.src = imgSrc;
    imgElement.onerror = function () {
        this.src = '/symbols/songImg.svg';
    };
    document.querySelector(".song-info").innerHTML = `<img class='song-img li-img' src="${imgElement.src}" alt="Music Img" onerror="this.onerror=null; this.src='/symbols/songImg.svg';">` + decodeURI(track).replace(".mp3", "");
    document.querySelector(".song-time").innerHTML = `00:00 / 00:00`;
}

async function main() {

    folders = await getFolder();

    // Get the initial list of songs
    songs = await getSongs(folders[0]);
    currentSong.volume = 0.75;

    let play = document.getElementById('play');
    let prev = document.getElementById('prev');
    let next = document.getElementById('next');

    let songOL = document.querySelector(".song-list").getElementsByTagName("ol")[0];
    songsUpdate(play, songOL, true);

    // Display albums in playlist
    let playlist = document.querySelector('.grid');
    for (const folder of folders) {
        let album = await fetch(`/Songs/${folder}/info.json`);
        let albumInfo = await album.json();
        playlist.innerHTML = playlist.innerHTML + `<div class="card font-400 rounded" data-info = '${folder}'>
                            <div class="cardImg">
                                <img class="rounded" src="/Songs/${folder}/cover.jpg" alt="Chillout Lounge">
                                <button><img class="w-img" src="/symbols/play-button.svg" alt="play"></button>
                            </div>
                            <p class="title">${albumInfo.title}</p>
                            <p class="color-grey desc">${albumInfo.description}</p>
                            </div>`
    }

    Array.from(document.getElementsByClassName('card')).forEach(e => {
        e.addEventListener('click', async function () {
            songs = await getSongs(e.dataset.info);
            songsUpdate(play, songOL)
        })
    })

    // Attach an event listener to play, prev and next button
    play.addEventListener('click', () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = '/symbols/pause.svg'
        }
        else {
            currentSong.pause()
            play.src = '/symbols/play.svg'
        }
    })

    prev.addEventListener('click', () => {

        let index = songs.indexOf(currentSong.src.split("/")[currentSong.src.split("/").length - 1])
        if (index - 1 == -1) {
            index = songs.length
        }
        playMusic(songs[index - 1])
        play.src = '/symbols/pause.svg'
    })

    prev.addEventListener('mouseover', () => {
        prev.src = '/symbols/prev_hover.svg'
    })

    prev.addEventListener('mouseout', () => {
        prev.src = '/symbols/prev.svg'
    })

    next.addEventListener('click', () => {

        let index = songs.indexOf(currentSong.src.split("/")[currentSong.src.split("/").length - 1])
        if (index + 1 == songs.length) {
            index = - 1;
        }
        playMusic(songs[index + 1])
        play.src = '/symbols/pause.svg'
    })

    next.addEventListener('mouseover', () => {
        next.src = '/symbols/next_hover.svg'
    })

    next.addEventListener('mouseout', () => {
        next.src = '/symbols/next.svg'
    })

    currentSong.addEventListener('ended', () => {
        let index = songs.indexOf(currentSong.src.split("/")[currentSong.src.split("/").length - 1]);
        if (index + 1 == songs.length) {
            index = - 1;
        }
        playMusic(songs[index + 1])
        play.src = '/symbols/pause.svg'
    });

    // Listen for timeupdate event
    currentSong.addEventListener('timeupdate', () => {
        document.querySelector('.song-time').innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;

        document.querySelector('.circle').style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        document.querySelector('.rect').style.width = (currentSong.currentTime / currentSong.duration) * 100 + 0.8 + "%";
    })

    const seekbar = document.querySelector('.seekbar');
    const circle = document.querySelector('.circle');
    const rectangle = document.querySelector('.rect');
    let isDragging = false;
    let wasPlaying = false;

    // Function to update circle position and current time
    const updateCircle = (clientX) => {
        let rect = seekbar.getBoundingClientRect();
        let offsetX = clientX - rect.left;
        let percent = Math.max(0, Math.min(100, (offsetX / rect.width) * 100)); // Constrain percent between 0 and 100

        rectangle.style.width = percent + '%';
        circle.style.left = percent + "%";
        currentSong.currentTime = (percent / 100) * currentSong.duration;
    };

    // Click or tap on seekbar
    seekbar.addEventListener('mousedown', e => {
        e.preventDefault(); // Prevent default to avoid text selection on desktop
        isDragging = true;
        updateCircle(e.clientX);
        seekbar.style.borderColor = 'white';
        circle.style.height = 13 + 'px';
        circle.style.width = 13 + 'px';
        circle.style.backgroundColor = 'white';
        rectangle.style.backgroundColor = 'white';
    });

    seekbar.addEventListener('touchstart', e => {
        e.preventDefault(); // Prevent default touch behavior
        isDragging = true;
        updateCircle(e.touches[0].clientX);
        seekbar.style.borderColor = 'white';
        circle.style.height = 13 + 'px';
        circle.style.width = 13 + 'px';
        circle.style.backgroundColor = 'white';
        rectangle.style.backgroundColor = 'white';
    });

    // Dragging or swiping
    document.addEventListener('mousemove', e => {
        if (isDragging) {
            updateCircle(e.clientX);
        }
    });

    document.addEventListener('touchmove', e => {
        if (isDragging) {
            updateCircle(e.touches[0].clientX);
        }
    });

    // Release click or tap
    document.addEventListener('mouseup', e => {
        if (isDragging) {
            isDragging = false;
            if (wasPlaying) {
                currentSong.play();
            }
            seekbar.style.borderColor = 'rgb(226, 226, 226)';
            circle.style.height = 12 + 'px';
            circle.style.width = 12 + 'px';
            circle.style.backgroundColor = 'rgb(226, 226, 226)';
            rectangle.style.backgroundColor = 'rgb(226, 226, 226)';
        }
    });

    document.addEventListener('touchend', e => {
        if (isDragging) {
            isDragging = false;
            if (wasPlaying) {
                currentSong.play();
            }
            seekbar.style.borderColor = 'rgb(226, 226, 226)';
            circle.style.height = 12 + 'px';
            circle.style.width = 12 + 'px';
            circle.style.backgroundColor = 'rgb(226, 226, 226))';
            rectangle.style.backgroundColor = 'rgb(226, 226, 226)';
        }
    });

    seekbar.addEventListener('mouseover', () => {
        if (!isDragging) {
            seekbar.style.borderColor = 'white';
            circle.style.height = 13 + 'px';
            circle.style.width = 13 + 'px';
            circle.style.backgroundColor = 'white';
            rectangle.style.backgroundColor = 'white';
        }
    })

    seekbar.addEventListener('mouseout', () => {
        if (!isDragging) {
            seekbar.style.borderColor = 'rgb(226, 226, 226)';
            circle.style.height = 12 + 'px';
            circle.style.width = 12 + 'px';
            circle.style.backgroundColor = 'rgb(226, 226, 226)';
            rectangle.style.backgroundColor = 'rgb(226, 226, 226)';
        }
    })

    // Circle drag event
    circle.addEventListener('mousedown', e => {
        e.preventDefault();
        isDragging = true;
        wasPlaying = !currentSong.paused;
        currentSong.pause();
    });

    circle.addEventListener('touchstart', e => {
        e.preventDefault();
        isDragging = true;
        wasPlaying = !currentSong.paused;
        currentSong.pause();
    });

    // Stop dragging circle
    document.addEventListener('mouseup', e => {
        if (isDragging) {
            isDragging = false;
            if (wasPlaying) {
                currentSong.play();
            }
        }
    });

    document.addEventListener('touchend', e => {
        if (isDragging) {
            isDragging = false;
            if (wasPlaying) {
                currentSong.play();
            }
        }
    });

    // Add an event listener to ham
    document.querySelector('.ham').addEventListener('click', e => {
        document.querySelector('.left').style.left = 0;
        document.querySelector('.left').style.opacity = 1;
    })

    // Add an event listener to close
    document.querySelector('.close').addEventListener('click', e => {
        document.querySelector('.left').style.left = "-120%";
        document.querySelector('.left').style.opacity = 0;
    })

    // Home and Search effects
    document.getElementById('home-btn').addEventListener('mouseover', e => {
        document.getElementById('home-img').src = '/symbols/home_hover.svg';
    })

    document.getElementById('home-btn').addEventListener('mouseout', e => {
        document.getElementById('home-img').src = '/symbols/home.svg';
    })

    document.getElementById('search-btn').addEventListener('mouseover', e => {
        document.getElementById('search-img').src = '/symbols/search_hover.svg';
    })

    document.getElementById('search-btn').addEventListener('mouseout', e => {
        document.getElementById('search-img').src = '/symbols/search.svg';
    })

    // volume

    let vol_clicked = false;
    let first_click = false;
    let mute = false;

    document.querySelector('.volume').addEventListener('mouseover', e => {
        document.querySelector('.slider').style.opacity = 1;
        document.querySelector('.slider').style.width = 100 + 'px';
        if (mute) {
            document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/mute_hov.svg'
        }
        else {
            document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/volume_hov.svg'
        }
    })

    document.querySelector('.volume').addEventListener('mouseout', e => {
        if (!vol_clicked) {
            document.querySelector('.slider').style.opacity = 0;
            document.querySelector('.slider').style.width = 0;
            if (mute) {
                document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/mute.svg'
            }
            else {
                document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/volume.svg'
            }
        }
    })

    document.querySelector('.volume').getElementsByTagName('img')[0].addEventListener('click', e => {
        e.stopPropagation()
        if (!vol_clicked) {
            document.querySelector('.slider').style.opacity = 1;
            document.querySelector('.slider').style.width = 100 + 'px';
            if (mute) {
                document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/mute_hov.svg'
            }
            else {
                document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/volume_hov.svg'
            }
            vol_clicked = true;
        }
        else if (vol_clicked) {
            if (mute) {
                document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/volume_hov.svg'
                mute = false;
                currentSong.volume = 0.1;
                document.querySelector('.slider').value = 10;
            }
            else {
                document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/mute_hov.svg'
                mute = true;
                currentSong.volume = 0;
                document.querySelector('.slider').value = 0;
            }
        }
    })

    document.addEventListener('click', () => {
        if (vol_clicked) {
            document.querySelector('.slider').style.opacity = 0;
            document.querySelector('.slider').style.width = 0;
            if (mute) {
                document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/mute.svg'
            }
            else {
                document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/volume.svg'
            }
            vol_clicked = false;
            first_click = false;
        }
    })

    document.querySelector('.range').getElementsByTagName('input')[0].addEventListener('change', (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        mute = false;
        document.querySelector('.volume').getElementsByTagName('img')[0].src = '/symbols/volume_hov.svg'
    });

    document.querySelector('.volume').addEventListener('click', e => {
        e.stopPropagation()
    })

    // add eventlisteners to left and right
    l = document.getElementById('l');
    r = document.getElementById('r');

    l.addEventListener('mouseover', e => {
        l.src = '/symbols/left_hov.svg';
    })

    l.addEventListener('mouseout', e => {
        l.src = '/symbols/left.svg';
    })

    l.addEventListener('click', async function () {
        let index = folders.indexOf(currentFolder);
        if (index - 1 >= 0) {
            songs = await getSongs(folders[index - 1])
            songsUpdate(play, songOL);
        }
    })

    r.addEventListener('mouseover', e => {
        r.src = '/symbols/right_hov.svg';
    })

    r.addEventListener('mouseout', e => {
        r.src = '/symbols/right.svg';
    })

    r.addEventListener('click', async function () {
        let index = folders.indexOf(currentFolder);
        if (index + 1 < folders.length) {
            songs = await getSongs(folders[index + 1])
            songsUpdate(play, songOL);
        }
    })

}

main()


