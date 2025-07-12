-- Create tables for the Digitec learning platform

-- Users table is managed by Supabase Auth

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  category TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sub-courses table (modules within a course)
CREATE TABLE sub_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_course_id UUID REFERENCES sub_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  duration TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table (main course enrollments)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Sub-course enrollments table (enrollments in specific modules)
CREATE TABLE sub_course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  sub_course_id UUID REFERENCES sub_courses(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sub_course_id)
);

-- Lesson progress table
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  sub_course_id UUID REFERENCES sub_courses(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage FLOAT CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_user_profiles_id ON user_profiles(id);
CREATE INDEX idx_courses_id ON courses(id);
CREATE INDEX idx_sub_courses_course_id ON sub_courses(course_id);
CREATE INDEX idx_lessons_sub_course_id ON lessons(sub_course_id);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_sub_course_enrollments_user_id ON sub_course_enrollments(user_id);
CREATE INDEX idx_sub_course_enrollments_sub_course_id ON sub_course_enrollments(sub_course_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Courses policies (public read, admin write)
CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  USING (true);

-- Sub-courses policies (public read, admin write)
CREATE POLICY "Anyone can view sub-courses"
  ON sub_courses FOR SELECT
  USING (true);

-- Lessons policies (enrolled users can view)
CREATE POLICY "Enrolled users can view lessons"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sub_course_enrollments
      WHERE sub_course_enrollments.sub_course_id = lessons.sub_course_id
      AND sub_course_enrollments.user_id = auth.uid()
    )
  );

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sub-course enrollments policies
CREATE POLICY "Users can view their own sub-course enrollments"
  ON sub_course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sub-course enrollments"
  ON sub_course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Lesson progress policies
CREATE POLICY "Users can view their own lesson progress"
  ON lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create and update their own lesson progress"
  ON lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress"
  ON lesson_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create functions and triggers
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_courses_updated_at
  BEFORE UPDATE ON sub_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_course_enrollments_updated_at
  BEFORE UPDATE ON sub_course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
-- Insert sample courses
INSERT INTO courses (title, description, image_url, video_url, category, level, duration, order_index)
VALUES 
  ('Microsoft Office Suite', 'Master essential Microsoft Office applications for professional productivity', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/embed/Vl0H-qTclOg', 'Office Skills', 'beginner', '8 weeks', 1),
  
  ('Graphic Design Specialist', 'Become a professional graphic designer with industry-standard tools', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/embed/dFSia1LZI4Y', 'Design', 'intermediate', '12 weeks', 2),
  
  ('Frontend Development', 'Learn modern frontend development with HTML, CSS, and JavaScript', 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/embed/zJSY8tbf_ys', 'Web Development', 'beginner', '10 weeks', 3),
  
  ('Backend Development', 'Master backend development with Node.js, Express, and databases', 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/embed/Oe421EPjeBE', 'Web Development', 'intermediate', '12 weeks', 4),
  
  ('Forex Trading', 'Learn professional forex trading strategies and risk management', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/embed/y8TsQn2eKxA', 'Finance', 'advanced', '8 weeks', 5),
  
  ('Data Analysis', 'Master data analysis with Excel, SQL, and Python', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/embed/r-uOLxNrNk8', 'Data Science', 'intermediate', '10 weeks', 6),
  
  ('UI/UX Design', 'Learn UI/UX design with Photoshop, CorelDRAW, and Canva', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/embed/c9Wg6Cb_YlU', 'Design', 'intermediate', '10 weeks', 7);

-- Microsoft Office Suite sub-courses
INSERT INTO sub_courses (course_id, title, description, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM courses WHERE title = 'Microsoft Office Suite'), 'Microsoft Word', 'Master document creation and formatting in Microsoft Word', 'https://www.youtube.com/embed/S-nHYzK-BVg', '2 weeks', 1),
  ((SELECT id FROM courses WHERE title = 'Microsoft Office Suite'), 'Microsoft Excel', 'Learn spreadsheets, formulas, and data analysis in Excel', 'https://www.youtube.com/embed/Vl0H-qTclOg', '3 weeks', 2),
  ((SELECT id FROM courses WHERE title = 'Microsoft Office Suite'), 'Microsoft PowerPoint', 'Create professional presentations with PowerPoint', 'https://www.youtube.com/embed/u7Tku3_RGPs', '2 weeks', 3),
  ((SELECT id FROM courses WHERE title = 'Microsoft Office Suite'), 'Microsoft Outlook', 'Manage email, calendar, and tasks efficiently with Outlook', 'https://www.youtube.com/embed/Mpkg0RnkMkw', '1 week', 4);

-- Graphic Design Specialist sub-courses
INSERT INTO sub_courses (course_id, title, description, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM courses WHERE title = 'Graphic Design Specialist'), 'Adobe Photoshop', 'Master image editing and manipulation with Photoshop', 'https://www.youtube.com/embed/IyR_uYsRdPs', '4 weeks', 1),
  ((SELECT id FROM courses WHERE title = 'Graphic Design Specialist'), 'CorelDRAW', 'Create vector graphics and layouts with CorelDRAW', 'https://www.youtube.com/embed/TTFwUGrRsOk', '3 weeks', 2),
  ((SELECT id FROM courses WHERE title = 'Graphic Design Specialist'), 'Adobe Illustrator', 'Design vector graphics and illustrations with Illustrator', 'https://www.youtube.com/embed/Ib8UBwu3yGA', '3 weeks', 3),
  ((SELECT id FROM courses WHERE title = 'Graphic Design Specialist'), 'Design Principles', 'Learn fundamental principles of effective graphic design', 'https://www.youtube.com/embed/dFSia1LZI4Y', '2 weeks', 4);

-- Frontend Development sub-courses
INSERT INTO sub_courses (course_id, title, description, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM courses WHERE title = 'Frontend Development'), 'HTML Fundamentals', 'Learn the basics of HTML and document structure', 'https://www.youtube.com/embed/qz0aGYrrlhU', '2 weeks', 1),
  ((SELECT id FROM courses WHERE title = 'Frontend Development'), 'CSS Styling', 'Master CSS styling and responsive design', 'https://www.youtube.com/embed/1PnVor36_40', '3 weeks', 2),
  ((SELECT id FROM courses WHERE title = 'Frontend Development'), 'JavaScript Basics', 'Learn JavaScript programming fundamentals', 'https://www.youtube.com/embed/W6NZfCO5SIk', '3 weeks', 3),
  ((SELECT id FROM courses WHERE title = 'Frontend Development'), 'Modern Frameworks', 'Introduction to React, Vue, or Angular', 'https://www.youtube.com/embed/Tn6-PIqc4UM', '2 weeks', 4);

-- Backend Development sub-courses
INSERT INTO sub_courses (course_id, title, description, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM courses WHERE title = 'Backend Development'), 'Node.js Fundamentals', 'Learn server-side JavaScript with Node.js', 'https://www.youtube.com/embed/Oe421EPjeBE', '3 weeks', 1),
  ((SELECT id FROM courses WHERE title = 'Backend Development'), 'Express Framework', 'Build web applications with Express.js', 'https://www.youtube.com/embed/SccSCuHhOw0', '3 weeks', 2),
  ((SELECT id FROM courses WHERE title = 'Backend Development'), 'Database Integration', 'Work with SQL and NoSQL databases', 'https://www.youtube.com/embed/HXV3zeQKqGY', '3 weeks', 3),
  ((SELECT id FROM courses WHERE title = 'Backend Development'), 'API Development', 'Design and build RESTful APIs', 'https://www.youtube.com/embed/fgTGADljAeg', '3 weeks', 4);

-- Forex Trading sub-courses
INSERT INTO sub_courses (course_id, title, description, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM courses WHERE title = 'Forex Trading'), 'Forex Fundamentals', 'Understand currency markets and forex basics', 'https://www.youtube.com/embed/y8TsQn2eKxA', '2 weeks', 1),
  ((SELECT id FROM courses WHERE title = 'Forex Trading'), 'Technical Analysis', 'Master chart patterns and technical indicators', 'https://www.youtube.com/embed/lW1YH42r9GA', '2 weeks', 2),
  ((SELECT id FROM courses WHERE title = 'Forex Trading'), 'Trading Strategies', 'Learn profitable trading strategies and systems', 'https://www.youtube.com/embed/TzAqVCXWTKM', '2 weeks', 3),
  ((SELECT id FROM courses WHERE title = 'Forex Trading'), 'Risk Management', 'Implement effective risk and money management', 'https://www.youtube.com/embed/QKFhTTpyeCI', '2 weeks', 4);

-- Data Analysis sub-courses
INSERT INTO sub_courses (course_id, title, description, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM courses WHERE title = 'Data Analysis'), 'Excel for Data Analysis', 'Advanced Excel techniques for data analysis', 'https://www.youtube.com/embed/Vl0H-qTclOg', '2 weeks', 1),
  ((SELECT id FROM courses WHERE title = 'Data Analysis'), 'SQL Fundamentals', 'Query and manipulate data with SQL', 'https://www.youtube.com/embed/HXV3zeQKqGY', '3 weeks', 2),
  ((SELECT id FROM courses WHERE title = 'Data Analysis'), 'Python for Data Analysis', 'Learn Python with pandas and NumPy', 'https://www.youtube.com/embed/r-uOLxNrNk8', '3 weeks', 3),
  ((SELECT id FROM courses WHERE title = 'Data Analysis'), 'Data Visualization', 'Create effective data visualizations', 'https://www.youtube.com/embed/a9UrKTVEeZA', '2 weeks', 4);

-- UI/UX Design sub-courses
INSERT INTO sub_courses (course_id, title, description, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM courses WHERE title = 'UI/UX Design'), 'Photoshop for UI Design', 'Create user interfaces with Photoshop', 'https://www.youtube.com/embed/IyR_uYsRdPs', '3 weeks', 1),
  ((SELECT id FROM courses WHERE title = 'UI/UX Design'), 'CorelDRAW for Design', 'Design graphics and interfaces with CorelDRAW', 'https://www.youtube.com/embed/TTFwUGrRsOk', '2 weeks', 2),
  ((SELECT id FROM courses WHERE title = 'UI/UX Design'), 'Canva for Quick Designs', 'Create professional designs quickly with Canva', 'https://www.youtube.com/embed/IfIkgJhfCZE', '2 weeks', 3),
  ((SELECT id FROM courses WHERE title = 'UI/UX Design'), 'UX Principles', 'Learn user experience design fundamentals', 'https://www.youtube.com/embed/c9Wg6Cb_YlU', '3 weeks', 4);

-- Sample lessons for Microsoft Word
INSERT INTO lessons (sub_course_id, title, description, content, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM sub_courses WHERE title = 'Microsoft Word'), 'Getting Started with Word', 'Introduction to Microsoft Word interface', '<h2>Getting Started with Microsoft Word</h2><p>Microsoft Word is a powerful word processing application that allows you to create, edit, and format documents. In this lesson, we will explore the Word interface and learn about its basic features.</p><ul><li>Understanding the Ribbon interface</li><li>Working with the File menu</li><li>Using Quick Access Toolbar</li><li>Document views and navigation</li></ul>', 'https://www.youtube.com/embed/S-nHYzK-BVg', '30 minutes', 1),
  
  ((SELECT id FROM sub_courses WHERE title = 'Microsoft Word'), 'Document Formatting', 'Learn to format text and paragraphs', '<h2>Document Formatting in Word</h2><p>Formatting is essential for creating professional-looking documents. This lesson covers text and paragraph formatting options in Microsoft Word.</p><ul><li>Character formatting (font, size, color)</li><li>Paragraph formatting (alignment, spacing)</li><li>Working with styles</li><li>Page layout options</li></ul>', 'https://www.youtube.com/embed/Cz4Dtp-dKYs', '45 minutes', 2),
  
  ((SELECT id FROM sub_courses WHERE title = 'Microsoft Word'), 'Tables and Lists', 'Create and format tables and lists', '<h2>Tables and Lists in Word</h2><p>Tables and lists help organize information in a structured way. This lesson teaches you how to create and format tables and lists in your documents.</p><ul><li>Creating and modifying tables</li><li>Table styles and formatting</li><li>Bulleted and numbered lists</li><li>Multi-level lists</li></ul>', 'https://www.youtube.com/embed/9HBrxOsSSGk', '40 minutes', 3);

-- Sample lessons for Excel
INSERT INTO lessons (sub_course_id, title, description, content, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM sub_courses WHERE title = 'Microsoft Excel'), 'Excel Basics', 'Introduction to spreadsheets and Excel interface', '<h2>Excel Basics</h2><p>Microsoft Excel is a powerful spreadsheet application used for data analysis and calculations. This lesson introduces you to the Excel interface and basic concepts.</p><ul><li>Understanding the Excel interface</li><li>Working with cells, rows, and columns</li><li>Entering and editing data</li><li>Basic formatting options</li></ul>', 'https://www.youtube.com/embed/Vl0H-qTclOg', '35 minutes', 1),
  
  ((SELECT id FROM sub_courses WHERE title = 'Microsoft Excel'), 'Formulas and Functions', 'Learn essential Excel formulas and functions', '<h2>Excel Formulas and Functions</h2><p>Formulas and functions are the heart of Excel\'s calculation capabilities. This lesson covers the basics of creating formulas and using built-in functions.</p><ul><li>Creating basic formulas</li><li>Understanding cell references</li><li>Common functions (SUM, AVERAGE, COUNT)</li><li>Logical functions (IF, AND, OR)</li></ul>', 'https://www.youtube.com/embed/Jl0Qk63z2ZY', '50 minutes', 2),
  
  ((SELECT id FROM sub_courses WHERE title = 'Microsoft Excel'), 'Data Analysis Tools', 'Use Excel\'s data analysis features', '<h2>Excel Data Analysis Tools</h2><p>Excel offers powerful tools for analyzing and visualizing data. This lesson explores some of Excel\'s data analysis capabilities.</p><ul><li>Sorting and filtering data</li><li>Creating PivotTables</li><li>Data visualization with charts</li><li>Using data tables and what-if analysis</li></ul>', 'https://www.youtube.com/embed/K74_FNnlIF8', '45 minutes', 3);

-- Sample lessons for HTML Fundamentals
INSERT INTO lessons (sub_course_id, title, description, content, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM sub_courses WHERE title = 'HTML Fundamentals'), 'Introduction to HTML', 'What is HTML and why is it important', '<h2>Introduction to HTML</h2><p>HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page and consists of a series of elements that tell the browser how to display the content.</p><p>HTML elements are represented by tags, written using angle brackets.</p>', 'https://www.youtube.com/embed/qz0aGYrrlhU', '30 minutes', 1),
  
  ((SELECT id FROM sub_courses WHERE title = 'HTML Fundamentals'), 'HTML Document Structure', 'Learn about the structure of HTML documents', '<h2>HTML Document Structure</h2><p>Every HTML document has a specific structure that includes the following declarations and elements:</p><ul><li>DOCTYPE declaration</li><li>HTML element</li><li>Head element</li><li>Body element</li></ul><p>The DOCTYPE declaration tells the browser what type of document to expect, and the HTML, head, and body elements contain the content of the page.</p>', 'https://www.youtube.com/embed/UB1O30fR-EE', '45 minutes', 2),
  
  ((SELECT id FROM sub_courses WHERE title = 'HTML Fundamentals'), 'HTML Elements and Tags', 'Understanding HTML elements and tags', '<h2>HTML Elements and Tags</h2><p>HTML elements are represented by tags. Tags are keywords surrounded by angle brackets like &lt;tagname&gt;content&lt;/tagname&gt;.</p><p>HTML tags normally come in pairs like &lt;p&gt; and &lt;/p&gt;. The first tag in a pair is the start tag, the second tag is the end tag. The end tag is written like the start tag, but with a forward slash inserted before the tag name.</p>', 'https://www.youtube.com/embed/X4t0JxiBeO0', '60 minutes', 3);

-- Sample lessons for Photoshop for UI Design
INSERT INTO lessons (sub_course_id, title, description, content, video_url, duration, order_index)
VALUES 
  ((SELECT id FROM sub_courses WHERE title = 'Photoshop for UI Design'), 'Photoshop Interface', 'Understanding the Photoshop workspace', '<h2>Photoshop Interface for UI Design</h2><p>Adobe Photoshop provides a powerful environment for creating user interface designs. This lesson introduces the Photoshop workspace and tools relevant to UI design.</p><ul><li>Understanding the Photoshop interface</li><li>Working with layers</li><li>Essential tools for UI design</li><li>Setting up documents for web and mobile</li></ul>', 'https://www.youtube.com/embed/IyR_uYsRdPs', '40 minutes', 1),
  
  ((SELECT id FROM sub_courses WHERE title = 'Photoshop for UI Design'), 'Creating UI Elements', 'Design buttons, icons, and other UI components', '<h2>Creating UI Elements in Photoshop</h2><p>UI elements like buttons, icons, and navigation components are essential parts of any interface. This lesson teaches you how to create these elements in Photoshop.</p><ul><li>Designing buttons and call-to-actions</li><li>Creating custom icons</li><li>Working with shapes and vector tools</li><li>Using layer styles for consistent effects</li></ul>', 'https://www.youtube.com/embed/4R6FbKSIV_g', '55 minutes', 2),
  
  ((SELECT id FROM sub_courses WHERE title = 'Photoshop for UI Design'), 'Mockup Design', 'Create a complete UI mockup', '<h2>UI Mockup Design in Photoshop</h2><p>A mockup is a high-fidelity representation of the final product. This lesson guides you through creating a complete UI mockup for a web or mobile application.</p><ul><li>Planning your interface layout</li><li>Creating wireframes</li><li>Designing responsive layouts</li><li>Adding visual details and refinements</li></ul>', 'https://www.youtube.com/embed/6QwQvQMkgGU', '60 minutes', 3); 

-- Create video_transcripts table for storing lesson video transcripts
CREATE TABLE video_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_questions table for lesson quizzes
CREATE TABLE test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options
  correct_answer INTEGER NOT NULL, -- Index of the correct answer
  explanation TEXT, -- Optional explanation of the answer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_video_transcripts_lesson_id ON video_transcripts(lesson_id);
CREATE INDEX idx_test_questions_lesson_id ON test_questions(lesson_id);

-- Enable Row Level Security
ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for video_transcripts (enrolled users can view)
CREATE POLICY "Enrolled users can view video transcripts"
  ON video_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN sub_course_enrollments ON lessons.sub_course_id = sub_course_enrollments.sub_course_id
      WHERE lessons.id = video_transcripts.lesson_id
      AND sub_course_enrollments.user_id = auth.uid()
    )
  );

-- Create policy for test_questions (enrolled users can view)
CREATE POLICY "Enrolled users can view test questions"
  ON test_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN sub_course_enrollments ON lessons.sub_course_id = sub_course_enrollments.sub_course_id
      WHERE lessons.id = test_questions.lesson_id
      AND sub_course_enrollments.user_id = auth.uid()
    )
  );

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_video_transcripts_updated_at
  BEFORE UPDATE ON video_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_questions_updated_at
  BEFORE UPDATE ON test_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample video transcripts for existing lessons
INSERT INTO video_transcripts (lesson_id, transcript_text)
VALUES
  ((SELECT id FROM lessons WHERE title = 'Getting Started with Word' LIMIT 1),
   'Welcome to Getting Started with Microsoft Word! In this lesson, we''ll explore the Word interface and learn about its basic features.

Word is a powerful word processing application that allows you to create, edit, and format documents. Let''s get familiar with the interface.

First, let''s look at the Ribbon interface. The Ribbon is organized into tabs at the top of the window. Each tab contains groups of related commands. For example, the Home tab contains formatting commands, the Insert tab allows you to add various elements to your document, and so on.

The File menu, also known as the Backstage view, contains commands related to managing your documents, such as opening, saving, printing, and sharing.

The Quick Access Toolbar is located at the top-left corner of the window. It provides one-click access to commonly used commands like Save, Undo, and Redo. You can customize this toolbar to add the commands you use most frequently.

Word offers different document views to help you work with your document in various ways. The Print Layout view shows your document as it will appear when printed. Other views include Read Mode, Web Layout, Outline, and Draft.

Navigation in Word is straightforward. You can use the scroll bars, Page Up and Page Down keys, or the Navigation Pane to move around your document.

Practice exploring these elements of the Word interface to become comfortable with the application before moving on to formatting and more advanced features.'),

  -- Excel - Excel Basics
  ((SELECT id FROM lessons WHERE title = 'Excel Basics' LIMIT 1),
   'Welcome to Excel Basics! In this lesson, we''ll introduce you to the Excel interface and basic concepts.

Microsoft Excel is a powerful spreadsheet application used for data analysis and calculations. Let''s explore the interface.

The Excel window consists of a grid of cells organized into rows and columns. Columns are labeled with letters (A, B, C...), and rows are labeled with numbers (1, 2, 3...). Each cell is identified by its column letter and row number, such as A1 or B5.

At the top of the window, you''ll find the Ribbon interface with tabs containing different commands and features. The File tab opens the Backstage view, where you can manage your files. The Home tab contains formatting and editing commands, while other tabs offer specialized functions.

The Formula Bar is located above the grid, showing the contents of the selected cell and allowing you to edit cell data.

Now, let''s talk about working with cells, rows, and columns. You can select a cell by clicking on it, a row by clicking its row number, or a column by clicking its column letter. To select multiple cells, click and drag across them.

To enter data into a cell, simply select the cell and start typing. Press Enter to confirm your entry and move to the next cell below, or Tab to move to the next cell to the right.

You can edit cell contents by double-clicking on a cell or by selecting it and typing in the Formula Bar. To delete cell contents, select the cell and press Delete.

Basic formatting options are available on the Home tab. You can change font style, size, and color; adjust alignment; add borders; and apply number formats.

Practice these basics to build a foundation for more advanced Excel features in the following lessons.'),

  -- HTML Fundamentals - Introduction to HTML
  ((SELECT id FROM lessons WHERE title = 'Introduction to HTML' LIMIT 1),
   'Welcome to Introduction to HTML! In this lesson, we''ll cover what HTML is and why it''s important.

HTML, or HyperText Markup Language, is the standard markup language for creating web pages. It describes the structure of a web page and consists of a series of elements that tell the browser how to display the content.

HTML elements are represented by tags, written using angle brackets. Most elements have an opening tag and a closing tag, with content in between. For example, <h1>This is a heading</h1> defines a main heading.

Why is HTML important? It''s the foundation of all web pages. Even the most complex websites and web applications are built on HTML. It provides the structure that browsers need to render content properly.

HTML works hand in hand with CSS (Cascading Style Sheets) and JavaScript. HTML provides the structure, CSS controls the presentation and styling, and JavaScript adds interactivity.

HTML is also important because it''s designed to be accessible. Properly structured HTML helps screen readers and other assistive technologies understand web content, making the web accessible to people with disabilities.

Learning HTML is the first step to becoming a web developer. It''s relatively easy to learn the basics, but mastering HTML and understanding best practices takes time and practice.

In the next lessons, we''ll explore HTML document structure, elements, and tags in more detail. Get ready to start building your first web pages!'),

  -- Photoshop for UI Design - Photoshop Interface
  ((SELECT id FROM lessons WHERE title = 'Photoshop Interface' LIMIT 1),
   'Welcome to Photoshop Interface for UI Design! In this lesson, we''ll explore the Photoshop workspace and tools relevant to UI design.

Adobe Photoshop provides a powerful environment for creating user interface designs. Let''s get familiar with the interface elements that are most useful for UI designers.

The Photoshop workspace consists of several key components. At the top, you''ll find the Menu Bar with drop-down menus containing all available commands. Below that is the Options Bar, which displays settings for the currently selected tool.

On the left side of the screen is the Tools panel, containing selection tools, painting tools, type tools, and other utilities. For UI design, you''ll frequently use the Rectangle tool, the Move tool, the Type tool, and various selection tools.

On the right side, you''ll find several panels that can be customized based on your workflow. The most important panels for UI design include:

The Layers panel, which displays all layers in your document and allows you to organize and modify them. Layers are essential for UI design as they keep elements separate and editable.

The Properties panel, which shows options for the selected layer or tool.

The Character and Paragraph panels for formatting text.

The Color and Swatches panels for managing colors.

Working with layers is crucial for UI design. Each UI element should typically be on its own layer or in its own layer group. This makes it easy to edit, move, or style elements independently.

When setting up documents for web and mobile design, it''s important to use the correct dimensions and resolution. For web design, 72 PPI (pixels per inch) is standard, while mobile designs often use specific dimensions based on target devices.

Practice navigating the Photoshop interface and experiment with the tools to become comfortable with the environment before moving on to creating actual UI elements.'),

  -- Backend Development - What is Backend Development
  ((SELECT id FROM lessons WHERE title LIKE 'What is Backend Development%' LIMIT 1),
   'Welcome to our introduction to Backend Development! In this lesson, we''ll explore what backend development is and why it''s crucial for web applications.

Backend development refers to the server-side of web development. While frontend development focuses on what users see and interact with, backend development involves creating the server, application, and database that work behind the scenes to deliver information to users.

The primary role of backend development is managing server-side logic and data. This includes processing user requests, interacting with databases, authenticating users, and ensuring the security and performance of the application.

Backend developers work with various programming languages and frameworks. Common backend languages include Node.js, Python, Ruby, PHP, Java, and C#. Each has its own frameworks and libraries that simplify development tasks.

Node.js, for example, is a JavaScript runtime that allows developers to use JavaScript for server-side programming. Express.js is a popular Node.js framework for building web applications and APIs.

Backend servers handle various tasks, including:
- Database interactions: Storing, retrieving, updating, and deleting data
- API development: Creating endpoints that frontend applications can communicate with
- Authentication and authorization: Verifying user identities and controlling access to resources
- Business logic: Implementing the core functionality of the application
- Server-side rendering: Generating HTML on the server before sending it to the client

The HTTP protocol is commonly used for communication in backend systems. It defines how messages are formatted and transmitted over the web, allowing clients and servers to communicate effectively.

APIs, or Application Programming Interfaces, are a key component of backend development. They define the rules for how applications can communicate with each other, enabling frontend applications to interact with the backend server.

In the following lessons, we''ll dive deeper into these concepts and start building our own backend applications. Get ready to explore the powerful world of server-side programming!');

-- Create superusers table for admin access
CREATE TABLE superusers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE superusers ENABLE ROW LEVEL SECURITY;

-- Create superuser policies
CREATE POLICY "Only superusers can view superusers"
  ON superusers FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM superusers)
  );

-- Create a function to check if a user is a superuser
CREATE OR REPLACE FUNCTION is_superuser(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM superusers WHERE user_id = $1);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_superusers_updated_at
  BEFORE UPDATE ON superusers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Example: Add a superuser (replace with your user ID)
-- INSERT INTO superusers (user_id) VALUES ('your-user-id-here');

-- Sample test questions for lessons
INSERT INTO test_questions (lesson_id, question_text, options, correct_answer, explanation)
VALUES
  -- Word - Getting Started with Word
  ((SELECT id FROM lessons WHERE title = 'Getting Started with Word' LIMIT 1),
   'What is the main purpose of the Ribbon interface in Microsoft Word?',
   '["To organize tools by function", "To display document statistics", "To show page thumbnails", "To manage document versions"]',
   0,
   'The Ribbon interface organizes tools and commands into tabs by function, making it easier to find and use Word features.'),
   
  ((SELECT id FROM lessons WHERE title = 'Getting Started with Word' LIMIT 1),
   'Where is the Quick Access Toolbar located in Microsoft Word?',
   '["Top-left corner", "Bottom-right corner", "Middle of the screen", "In the File menu"]',
   0,
   'The Quick Access Toolbar is located in the top-left corner of the Word window, providing one-click access to frequently used commands.'),
   
  ((SELECT id FROM lessons WHERE title = 'Getting Started with Word' LIMIT 1),
   'Which view in Microsoft Word shows your document as it will appear when printed?',
   '["Print Layout view", "Web Layout view", "Draft view", "Outline view"]',
   0,
   'Print Layout view shows your document as it will appear when printed, including margins, headers, and footers.'),

  -- Excel - Excel Basics
  ((SELECT id FROM lessons WHERE title = 'Excel Basics' LIMIT 1),
   'What is a cell in Microsoft Excel?',
   '["The intersection of a row and column", "A formula", "A chart element", "The Excel application window"]',
   0,
   'A cell is the intersection of a row and column in an Excel spreadsheet, identified by its column letter and row number (e.g., A1).'),
   
  ((SELECT id FROM lessons WHERE title = 'Excel Basics' LIMIT 1),
   'How are columns labeled in Excel?',
   '["With letters (A, B, C...)", "With numbers (1, 2, 3...)", "With Roman numerals (I, II, III...)", "With symbols (@, #, $...)"]',
   0,
   'Columns in Excel are labeled with letters, starting with A and continuing through the alphabet.'),
   
  ((SELECT id FROM lessons WHERE title = 'Excel Basics' LIMIT 1),
   'Which key can you press to confirm a cell entry and move to the cell below?',
   '["Enter", "Tab", "Shift", "Ctrl"]',
   0,
   'Pressing Enter confirms your entry and moves the selection to the cell directly below.'),

  -- HTML - Introduction to HTML
  ((SELECT id FROM lessons WHERE title = 'Introduction to HTML' LIMIT 1),
   'What does HTML stand for?',
   '["HyperText Markup Language", "High-Tech Modern Language", "Hyperlink Text Management Language", "Home Tool Markup Language"]',
   0,
   'HTML stands for HyperText Markup Language, which is the standard markup language for creating web pages.'),
   
  ((SELECT id FROM lessons WHERE title = 'Introduction to HTML' LIMIT 1),
   'What are HTML elements represented by?',
   '["Tags", "Attributes", "Properties", "Values"]',
   0,
   'HTML elements are represented by tags, which are written using angle brackets, such as <p> for a paragraph element.'),
   
  ((SELECT id FROM lessons WHERE title = 'Introduction to HTML' LIMIT 1),
   'Which of the following is NOT one of the main technologies that work with HTML?',
   '["Java", "CSS", "JavaScript", "XML"]',
   0,
   'While Java is a programming language, it is not one of the core web technologies that work directly with HTML. CSS handles styling, and JavaScript adds interactivity.');

-- Create functions for admin dashboard
-- Function to get all tables
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  description TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tables.table_name::TEXT,
    (SELECT COUNT(*) FROM information_schema.tables t 
     LEFT JOIN pg_stat_user_tables st ON t.table_name = st.relname 
     WHERE t.table_name = tables.table_name)::BIGINT AS row_count,
    obj_description(pg_class.oid)::TEXT AS description
  FROM information_schema.tables
  JOIN pg_class ON tables.table_name = pg_class.relname
  WHERE 
    table_schema = 'public' AND
    table_type = 'BASE TABLE' AND
    table_name NOT IN ('schema_migrations', 'ar_internal_metadata', 'spatial_ref_sys')
  ORDER BY table_name;
END;
$$;

-- Function to get table columns
CREATE OR REPLACE FUNCTION get_columns(table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable BOOLEAN,
  column_default TEXT,
  is_primary_key BOOLEAN,
  is_identity BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cols.column_name::TEXT,
    cols.data_type::TEXT,
    cols.is_nullable = 'YES' AS is_nullable,
    cols.column_default::TEXT,
    (SELECT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY' AND
        tc.table_name = table_name AND
        kcu.column_name = cols.column_name
    )) AS is_primary_key,
    cols.is_identity = 'YES' AS is_identity
  FROM information_schema.columns cols
  WHERE cols.table_name = table_name AND cols.table_schema = 'public'
  ORDER BY ordinal_position;
END;
$$; 