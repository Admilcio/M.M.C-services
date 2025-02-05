/*
  # Update Customer Table RLS Policies

  1. Security Changes
    - Safely update policies for the customers table
    - Enable public insertion and reading of customer data
    - Maintain authenticated user access
  
  Note: This migration safely handles existing policies
*/

DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Customers can view and edit their own data" ON customers;
    DROP POLICY IF EXISTS "Allow public to insert customers" ON customers;
    DROP POLICY IF EXISTS "Customers can view their own data by email" ON customers;
    DROP POLICY IF EXISTS "Authenticated users can manage their own data" ON customers;
    
    -- Create new policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Allow public to insert customers'
    ) THEN
        CREATE POLICY "Allow public to insert customers"
            ON customers FOR INSERT
            TO public
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Customers can view their own data by email'
    ) THEN
        CREATE POLICY "Customers can view their own data by email"
            ON customers FOR SELECT
            TO public
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Authenticated users can manage their own data'
    ) THEN
        CREATE POLICY "Authenticated users can manage their own data"
            ON customers FOR ALL
            TO authenticated
            USING (auth.uid() = id);
    END IF;
END $$;