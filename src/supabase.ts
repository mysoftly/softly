import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nsblphhuvnlctfcmkttu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_V9WeWP0YCb9ZSgAd5EiCBQ_fLP8XvgL'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
