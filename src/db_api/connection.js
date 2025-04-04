import { createClient } from "@supabase/supabase-js"; // Import the Supabase client library


// Initialize the Supabase client with the Supabase URL and API key
// Define a class for the Supabase database connection
// This class will handle the connection to the Supabase database and provide methods for interacting with it
class SupabaseDbConnection {

    // Define the constructor for the class
    // Create a Supabase client instance using the URL and API key from environment variables
    constructor() {
        this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        this.supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    // Sign up method to create a new user in the database

    async signup(fname, lname, email, gnumber, password) {
        try {
            // Uses default email and password authentication method provided by Supabase
            // Creates a new user in the Supabase authentication system (aka `auth` table)
            const { data, err } = await this.supabase.auth.signUp({
                email: email,
                password: password, // Password and email validation will be handled client-side, hashing will be done by Supabase.
            });

            // If an error occurs during sign up, return an error message
            if (err) {
                return { success: false, error: err.message }
            }

            // If sign up to `auth` table is successful, insert the user data into our own personal table `user_table`
            // `user-table` has the following columns: `first_name`, `last_name`, `g_number`, `user_id` (which is a foreign key to the `auth` table)
            const { data: userData, error: insertError } = await this.supabase.from('user_table')
                .insert([{
                    first_name: fname,
                    last_name: lname,
                    g_number: gnumber,
                    user_id: data.user.id,
                },
                ]);

            // If an error occurs during the insert operation, return an error message
            if (insertError) {
                await this.supabase.auth.api.deleteUser(data.user.id);
                return { success: false, error: insertError.message }
            }

            // If both operations are successful, return a success message
            return { success: true }
        }
        catch (error) {
            return { success: false, error: "An unexpected error occurred. Please try again later." };
        }

    }

    // Check if a user exists in the database by email
    async userExists(gnumber) {
        try {

            // Queries the `user_table` to check if a user with the given gnumber already exists
            const existingUser = await this.supabase.from('user_table')
                .select('*')
                .eq('g_number', gnumber)
                .maybeSingle();

            if (existingUser.data !== null) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }
}

export const supabaseCon = new SupabaseDbConnection();