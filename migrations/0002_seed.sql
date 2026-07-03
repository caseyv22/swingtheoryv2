-- Seed data. Real coach bios pulled from the WordPress backup;
-- update phones/emails/photos before making photos live.

INSERT OR IGNORE INTO coaches (slug, name, title, bio, photo_url, specialties, phone, sort_order) VALUES
  (
    'luis-kim',
    'Luis Kim',
    'PGA Professional Instructor',
    '20+ years teaching. PGA Tour player adviser since 2013. LPGA Tour player adviser since 2018. Quadrilingual: English, Spanish, Korean, and Portuguese.',
    'https://swingtheory.golf/wp-content/uploads/2025/06/DSC07701-1024x683.jpg',
    '["Full swing","Tour-level coaching","Multilingual instruction"]',
    '(213) 327-4220',
    10
  ),
  (
    'rafael-gomez',
    'Rafael Gomez',
    'PGA Associate',
    'Nationally recognized First Tee instructor. Instructor for City of Los Angeles youth, seniors, and women. Has coached champion golfers and teams. Uses Sportsbox AI 3D motion analysis.',
    'https://swingtheory.golf/wp-content/uploads/2025/06/DSC07877-1024x683.jpg',
    '["Youth","Seniors","Womens","Sportsbox AI"]',
    '(626) 535-3360',
    20
  ),
  (
    'jae-lee',
    'Jae Lee',
    'Instructor',
    '8 years as Assistant Golf Professional at SeaCliff CC. Former competitive golfer. Dana Dahlquist Golf Academy certified. Sportsbox AI 3D Motion Analysis certified.',
    'https://swingtheory.golf/wp-content/uploads/2025/06/DSC07806-1024x683.jpg',
    '["Full swing","Sportsbox AI","Dana Dahlquist certified"]',
    '(562) 483-3422',
    30
  );

INSERT OR IGNORE INTO programs (slug, name, kicker, h1, short_desc, long_desc, audience, season, key_details, image_url, cta_label, cta_target, sort_order) VALUES
  (
    'mini-mulligans',
    'Mini Mulligans',
    'Junior program',
    'Junior golf lessons in Pasadena — Mini Mulligans',
    'Junior golf lessons and clinics for kids in Pasadena — indoor bays, real coaches, and a low-pressure way to get started.',
    'Mini Mulligans is our junior program for kids learning to play golf. Small-group indoor lessons on the simulators give junior golfers real launch monitor data and instant swing feedback, in a fun, low-pressure environment. All equipment provided.',
    'Kids ages 6–14. All experience levels.',
    'Sessions run year-round; seasonal camps in summer and winter.',
    '["Small-group indoor coaching","All clubs provided (right and left-handed)","Real launch monitor data on every swing","Focus on fundamentals, fitness, and fun","Weekly sessions plus seasonal camps"]',
    'https://swingtheory.golf/wp-content/uploads/2025/06/DSC07701-1024x683.jpg',
    'Request Mini Mulligans info',
    'interest',
    20
  ),
  (
    'summer-womens',
    'Summer Women''s Program',
    'Summer series · Women''s',
    'Women''s golf program in Pasadena — Summer series',
    'A summer indoor golf program for women in Pasadena — group lessons, on-course prep, and a supportive community.',
    'Our summer women''s program pairs indoor group lessons with practice sessions and social play. Designed for beginners through intermediate players who want to build a real swing, meet other women who play, and take that game onto the course.',
    'Women, all skill levels — beginners welcome.',
    'Runs June through August.',
    '["Weekly group lessons with a dedicated coach","Indoor practice sessions on tour-grade simulators","On-course prep for real-world rounds","Community events and socials","All equipment provided"]',
    'https://swingtheory.golf/wp-content/uploads/2025/06/DSC07877-1024x683.jpg',
    'Request women''s program info',
    'interest',
    30
  ),
  (
    'summer-seniors',
    'Summer Seniors Program',
    'Summer series · Seniors',
    'Seniors golf program in Pasadena — Summer series',
    'A summer indoor golf program for seniors in Pasadena — group lessons, low-impact practice, and community rounds.',
    'The senior summer program is built for players 55+ who want to keep the game sharp without the heat, the walking, or the wait. Indoor lessons, comfortable bays, and a friendly group of regulars.',
    'Golfers 55+ of any skill level.',
    'Runs June through August.',
    '["Weekly group lessons with a dedicated coach","Low-impact indoor practice","Focus on rhythm, contact, and course management","Community rounds and socials","All equipment provided"]',
    'https://swingtheory.golf/wp-content/uploads/2025/06/DSC07806-1024x683.jpg',
    'Request seniors program info',
    'interest',
    40
  );
