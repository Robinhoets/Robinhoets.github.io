(function () {

    /* =========================================================
       CONFIG
       ========================================================= */

    const TIME_MILESTONES = [
        15,
        30,
        60,
        120,
        300
    ];

    const SCROLL_MILESTONES = [
        25,
        50,
        75,
        100
    ];


    /* =========================================================
       HELPERS
       ========================================================= */

    function sendEvent(eventName, parameters = {}) {

        if (typeof gtag !== "function") {
            return;
        }

        gtag("event", eventName, {
            page_path: window.location.pathname,
            page_title: document.title,
            ...parameters
        });

    }


    /* =========================================================
       ACTIVE TIME ON PAGE
       ========================================================= */

    let activeStart = Date.now();
    let totalActiveMs = 0;
    let pageTimeSent = false;


    function startActiveTimer() {

        if (activeStart === null) {
            activeStart = Date.now();
        }

    }


    function stopActiveTimer() {

        if (activeStart !== null) {

            totalActiveMs += Date.now() - activeStart;

            activeStart = null;

        }

    }


    function getActiveSeconds() {

        let total = totalActiveMs;

        if (activeStart !== null) {
            total += Date.now() - activeStart;
        }

        return Math.floor(total / 1000);

    }


    function sendFinalPageTime() {

        if (pageTimeSent) {
            return;
        }

        stopActiveTimer();

        const seconds = getActiveSeconds();

        if (seconds > 0) {

            sendEvent("page_time", {
                time_on_page_seconds: seconds,
                transport_type: "beacon"
            });

        }

        pageTimeSent = true;

    }


    document.addEventListener("visibilitychange", function () {

        if (document.visibilityState === "hidden") {

            stopActiveTimer();

        } else {

            startActiveTimer();

        }

    });


    window.addEventListener(
        "pagehide",
        sendFinalPageTime
    );


    /* =========================================================
       TIME MILESTONES

       Sends:
       engaged_15_seconds
       engaged_30_seconds
       engaged_60_seconds
       etc.
       ========================================================= */

    const timeMilestonesFired = {};


    setInterval(function () {

        if (document.visibilityState !== "visible") {
            return;
        }

        const activeSeconds = getActiveSeconds();

        TIME_MILESTONES.forEach(function (seconds) {

            if (
                activeSeconds >= seconds &&
                !timeMilestonesFired[seconds]
            ) {

                timeMilestonesFired[seconds] = true;

                sendEvent(
                    "engaged_" + seconds + "_seconds",
                    {
                        engagement_seconds: seconds
                    }
                );

            }

        });

    }, 1000);


    /* =========================================================
       SCROLL DEPTH
       ========================================================= */

    const scrollMilestonesFired = {};


    function checkScrollDepth() {

        const documentHeight =
            document.documentElement.scrollHeight;

        const viewportHeight =
            window.innerHeight;

        const scrollTop =
            window.scrollY ||
            document.documentElement.scrollTop;

        const scrollableHeight =
            documentHeight - viewportHeight;


        if (scrollableHeight <= 0) {

            return;

        }


        const scrollPercent =
            Math.min(
                100,
                Math.round(
                    (scrollTop / scrollableHeight) * 100
                )
            );


        SCROLL_MILESTONES.forEach(function (milestone) {

            if (
                scrollPercent >= milestone &&
                !scrollMilestonesFired[milestone]
            ) {

                scrollMilestonesFired[milestone] = true;

                sendEvent(
                    "scroll_depth",
                    {
                        percent_scrolled: milestone
                    }
                );

            }

        });

    }


    window.addEventListener(
        "scroll",
        checkScrollDepth,
        { passive: true }
    );


    /* =========================================================
       CLICK TRACKING
       ========================================================= */

    document.addEventListener("click", function (event) {

        const link = event.target.closest("a");

        if (!link) {
            return;
        }


        const href =
            link.getAttribute("href") || "";


        /* -----------------------------------------------------
           Resume
           ----------------------------------------------------- */

        if (
            href.toLowerCase().includes("resume") &&
            href.toLowerCase().includes(".pdf")
        ) {

            sendEvent(
                "resume_download",
                {
                    link_url: link.href
                }
            );

        }


        /* -----------------------------------------------------
           GitHub
           ----------------------------------------------------- */

        if (
            href.includes("github.com")
        ) {

            sendEvent(
                "github_click",
                {
                    link_url: link.href
                }
            );

        }


        /* -----------------------------------------------------
           Quadcopter GitHub repository
           ----------------------------------------------------- */

        if (
            href.includes(
                "github.com/Robinhoets/stm32f407-quadcopter"
            )
        ) {

            sendEvent(
                "quadcopter_repo_click",
                {
                    link_url: link.href
                }
            );

        }


        /* -----------------------------------------------------
           Blog
           ----------------------------------------------------- */

        if (
            href.includes("/blog") ||
            href.includes("blog/index.html")
        ) {

            sendEvent(
                "blog_click",
                {
                    link_url: link.href
                }
            );

        }

    });


    /* =========================================================
       VIDEO TRACKING
       ========================================================= */

    document
        .querySelectorAll("video")
        .forEach(function (video, index) {

            let playTracked = false;

            let halfwayTracked = false;

            let completeTracked = false;


            video.addEventListener(
                "play",
                function () {

                    if (playTracked) {
                        return;
                    }

                    playTracked = true;

                    sendEvent(
                        "video_play",
                        {
                            video_index: index,
                            video_src:
                                video.currentSrc ||
                                video.src ||
                                "unknown"
                        }
                    );

                }
            );


            video.addEventListener(
                "timeupdate",
                function () {

                    if (
                        !video.duration ||
                        !isFinite(video.duration)
                    ) {
                        return;
                    }


                    const percent =
                        (video.currentTime / video.duration) *
                        100;


                    if (
                        percent >= 50 &&
                        !halfwayTracked
                    ) {

                        halfwayTracked = true;

                        sendEvent(
                            "video_50_percent",
                            {
                                video_index: index,
                                video_src:
                                    video.currentSrc ||
                                    video.src ||
                                    "unknown"
                            }
                        );

                    }

                }
            );


            video.addEventListener(
                "ended",
                function () {

                    if (completeTracked) {
                        return;
                    }

                    completeTracked = true;

                    sendEvent(
                        "video_complete",
                        {
                            video_index: index,
                            video_src:
                                video.currentSrc ||
                                video.src ||
                                "unknown"
                        }
                    );

                }
            );

        });


})();