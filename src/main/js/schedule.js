// 课表
const scheduleData = {
    '星期一': [
        { name: "语文", start: "08:00", end: "08:40" },
        { name: "英语", start: "09:00", end: "21:10" },
        { name: "数学", start: "21:15", end: "21:16" },
        { name: "历史", start: "21:17", end: "21:20" },
        { name: "道法", start: "21:25", end: "21:46" },
        { name: "地理", start: "22:00", end: "23:00" },
    ],
    '星期二': [
        { name: "语文", start: "08:00", end: "08:40" },
        { name: "英语", start: "09:00", end: "21:10" },
        { name: "数学", start: "21:15", end: "21:16" },
        { name: "历史", start: "21:17", end: "21:20" },
        { name: "道法", start: "21:25", end: "21:46" },
        { name: "地理", start: "22:00", end: "23:00" },
    ],
    '星期三': [
        { name: "早读", start: "07:30", end: "07:55" },
        { name: "英语", start: "08:00", end: "08:40" },
        { name: "数学", start: "08:55", end: "09:35" },
        { name: "生物", start: "10:05", end: "10:45" },
        { name: "语文", start: "11:00", end: "11:40" },
        { name: "信息", start: "13:00", end: "13:40" },
        { name: "信息", start: "13:55", end: "14:35" },
        { name: "美术", start: "14:50", end: "15:30" },
        { name: "自习", start: "15:40", end: "17:25" },
    ],
    '星期四': [
        { name: "语文", start: "08:00", end: "08:40" },
        { name: "英语", start: "09:00", end: "21:10" },
        { name: "数学", start: "21:15", end: "21:16" },
        { name: "历史", start: "21:17", end: "21:20" },
        { name: "道法", start: "21:25", end: "21:46" },
        { name: "地理", start: "22:00", end: "23:00" },
    ],
    '星期五': [
        { name: "语文", start: "08:00", end: "08:40" },
        { name: "英语", start: "09:00", end: "21:10" },
        { name: "数学", start: "21:15", end: "21:16" },
        { name: "历史", start: "21:17", end: "21:20" },
        { name: "道法", start: "21:25", end: "21:46" },
        { name: "地理", start: "22:00", end: "23:00" },
    ]
};

// 时间计算
const TimeUtils = {
    parse: timeStr => {
        const [h, m] = timeStr.split(':');
        return parseInt(h) * 3600 + parseInt(m) * 60;
    },
    format: seconds => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [
            h > 0 ? h.toString().padStart(2, '0') + ':' : '',
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].join(':');
    },
    now: () => {
        const d = new Date();
        return d.getHours() * 3600 +
            d.getMinutes() * 60 +
            d.getSeconds();
    }
};

// 课表渲染类
class CourseScheduler {
    constructor() {
        this.timer = null;
        this.timeOffset = parseInt(localStorage.getItem('timeOffset')) || 0;
    }

    // 初始化
    init() {
        this.getSentence();
        this.getWeather();
        this.updateWeekDisplay();
        this.renderTimetable();
        this.startSchedule();
    }

    // 获取每日一言
    getSentence() {
        const sentenceElement = document.getElementById('sentence');
        fetch('https://api.vvhan.com/api/dailyEnglish?type=sj')
            .then(response => {
                if (!response.ok) {
                    throw new Error('每日一言-网络 失败了');
                }
                return response.json();
            })
            .then(data => {
                if (data.success)
                    sentenceElement.textContent = data.data.zh;
            })
            .catch(error => {
                sentenceElement.textContent = '每日一言 失败了';
            });
    }

    // 获取天气
    getWeather() {
        const sentenceElement = document.getElementById('weather');
        fetch('https://api.vvhan.com/api/weather')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    sentenceElement.textContent = `${data.data.type} | ${data.data.low} ~ ${data.data.high} | ${data.air.aqi_name}`;
                } else {
                    throw new Error('天气-网络 失败了');
                }
            })
            .catch(error => {
                sentenceElement.textContent = '天气 失败了';
            });
    }

    // 渲染星期
    updateWeekDisplay() {
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const today = new Date().getDay();
        document.getElementById('currentWeekCH').textContent = weekdays[today];
    }

    // 渲染课表
    renderTimetable() {
        const container = document.getElementById('classContainer');
        container.innerHTML = '';
        const currentWeek = document.getElementById('currentWeekCH').textContent;
        const courses = scheduleData[currentWeek] || [];

        courses.forEach(course => {
            const div = document.createElement('div');
            div.className = 'class';
            div.dataset.start = course.start;
            div.dataset.end = course.end;

            if (course.name.includes('@')) {
                const [main, sub] = course.name.split('@');
                div.innerHTML = `
                    <div>
                        <div class="main-course">${main}</div>
                        <div class="sub-course">${sub}</div>
                    </div>
                `;
            } else {
                div.innerHTML = `<div class="main-course">${course.name}</div>`;
            }
            container.appendChild(div);
        });
    }

    // 开始计时
    startSchedule() {
        this.timer = setInterval(() => this.update(), 1000);
        this.update();
    }

    // tick更新
    update() {
        this.timeOffset = parseInt(localStorage.getItem('timeOffset')) || 0;
        const current = TimeUtils.now() + this.timeOffset;
        const courses = Array.from(document.getElementsByClassName('class'));

        const activeCourse = courses.find(course => {
            const start = TimeUtils.parse(course.dataset.start);
            const end = TimeUtils.parse(course.dataset.end);
            return current >= start && current < end;
        });

        courses.forEach(c => c.classList.remove('current'));
        if (activeCourse) {
            activeCourse.classList.add('current');
            this.updateCurrentCourse(activeCourse);
        } else {
            this.updateNextCourse(current, courses);
        }
    }

    // 更新当前课程
    updateCurrentCourse(course) {
        const endTime = TimeUtils.parse(course.dataset.end);
        const remaining = endTime - TimeUtils.now();

        document.getElementById('currentFullName').textContent =
            course.querySelector('.main-course').textContent;
        this.updateCountdownDisplay(remaining);
    }

    // 更新下一课程
    updateNextCourse(current, courses) {
        const nextCourse = courses.find(c =>
            TimeUtils.parse(c.dataset.start) > current
        );

        if (nextCourse) {
            const nextStart = TimeUtils.parse(nextCourse.dataset.start);
            const countdown = nextStart - current;
            document.getElementById('currentFullName').textContent = "下课";
            courses.forEach(c => c.classList.remove('nextClass'));
            nextCourse.classList.add('nextClass');
            this.updateCountdownDisplay(countdown);
        } else {
            document.getElementById('currentFullName').textContent = "今日课程已结束";
            this.updateCountdownDisplay(0);
        }
    }

    // 更新倒计时显示
    updateCountdownDisplay(seconds) {
        const formatTime = (totalSeconds) => {
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            if (h > 0) {
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            } else {
                return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        };

        const timeStr = formatTime(Math.max(0, Math.floor(seconds)));

        document.getElementById('countdownText').textContent = timeStr;
    }
}

// 润
document.addEventListener('DOMContentLoaded', () => {
    new CourseScheduler().init();
});