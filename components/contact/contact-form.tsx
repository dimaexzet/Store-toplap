'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s-]+$/, 'Name can only contain letters, spaces and hyphens'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must contain at least 5 characters')
    .max(100, 'Email must not exceed 100 characters'),
  
  phone: z
    .string()
    .regex(/^\+?[0-9()-\s]{10,20}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  
  subject: z
    .string()
    .min(2, 'Subject must contain at least 2 characters')
    .max(100, 'Subject must not exceed 100 characters'),
  
  message: z
    .string()
    .min(10, 'Message must contain at least 10 characters')
    .max(1000, 'Message must not exceed 1000 characters'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });
  
  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }
      
      // Clear form and show success message
      form.reset();
      setIsSubmitted(true);
      
      toast({
        title: "Message Sent",
        description: "Thank you for your message! We will contact you shortly.",
        variant: "default",
      });
      
      // Reset submission state after 5 seconds so a new message can be sent
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting contact form:', error);
      
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="John Doe" 
                  {...field} 
                  disabled={isSubmitting || isSubmitted}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="john@example.com" 
                  type="email" 
                  {...field}
                  disabled={isSubmitting || isSubmitted}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+1 (555) 123-4567" 
                  {...field}
                  disabled={isSubmitting || isSubmitted}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Product Inquiry" 
                  {...field}
                  disabled={isSubmitting || isSubmitted}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Write your message here..." 
                  className="min-h-[120px]" 
                  {...field}
                  disabled={isSubmitting || isSubmitted}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="text-sm text-gray-500">* required fields</div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || isSubmitted}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : isSubmitted ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Sent
            </>
          ) : (
            'Send Message'
          )}
        </Button>
      </form>
    </Form>
  );
} 