
-- Blog posts table
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  author_name text NOT NULL DEFAULT 'Admin',
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (published = true);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'transaction',
  read boolean NOT NULL DEFAULT false,
  transaction_id uuid REFERENCES public.transactions(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to create notification on transaction insert/update
CREATE OR REPLACE FUNCTION public.notify_on_transaction()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, transaction_id)
  VALUES (
    NEW.user_id,
    CASE 
      WHEN NEW.status = 'completed' THEN 'Transfer Completed'
      WHEN NEW.status = 'failed' THEN 'Transfer Failed'
      WHEN NEW.status = 'pending' THEN 'Transfer Pending'
      ELSE 'Transaction Update'
    END,
    CASE 
      WHEN NEW.status = 'completed' THEN 'Your transfer of $' || NEW.amount || ' to ' || NEW.to_account_name || ' was successful.'
      WHEN NEW.status = 'failed' THEN 'Your transfer of $' || NEW.amount || ' to ' || NEW.to_account_name || ' has failed.'
      WHEN NEW.status = 'pending' THEN 'Your transfer of $' || NEW.amount || ' to ' || NEW.to_account_name || ' is being processed.'
      ELSE 'Transaction of $' || NEW.amount || ' status updated to ' || NEW.status || '.'
    END,
    'transaction',
    NEW.id
  );
  RETURN NEW;
END;
$$;

-- Trigger on insert and update
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OF status ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_transaction();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
