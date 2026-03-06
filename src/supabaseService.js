import { supabase } from './supabase'

// Homework
export async function getHomeworks() {
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .order('order_no')
  if (error) console.error(error)
  return data || []
}

// Questions
export async function getQuestions(homeworkId) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('homework_id', homeworkId)
    .order('order_no')
  if (error) console.error(error)
  return data || []
}

// Submissions
export async function getSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
  if (error) console.error(error)
  return data || []
}

export async function addSubmission(submission) {
  const { data, error } = await supabase
    .from('submissions')
    .insert([submission])
  if (error) console.error(error)
  return data
}

export async function getStudentSubmissions(studentId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', studentId)
  if (error) console.error(error)
  return data || []
}