-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('student', 'faculty');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create faculty table (stores additional faculty-specific info)
CREATE TABLE public.faculty (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table (stores additional student-specific info)
CREATE TABLE public.students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  enrollment_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE NOT NULL,
  feedback_text TEXT NOT NULL,
  sentiment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for faculty
CREATE POLICY "Anyone authenticated can view faculty list"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Faculty can view their own record"
  ON public.faculty FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Faculty can update their own record"
  ON public.faculty FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for students
CREATE POLICY "Students can view their own record"
  ON public.students FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Students can update their own record"
  ON public.students FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for feedback
CREATE POLICY "Students can insert feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'student') AND
    auth.uid() = student_id
  );

CREATE POLICY "Faculty can view their own feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'faculty') AND
    auth.uid() = faculty_id
  );

CREATE POLICY "Students can view their own submitted feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'student') AND
    auth.uid() = student_id
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email
  );
  
  RETURN new;
END;
$$;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();