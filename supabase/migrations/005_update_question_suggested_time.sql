-- Adjust suggested_time based on behavioral difficulty.
update public.questions
set suggested_time = case
  when track = 'behaviorals' and category in ('easy', 'medium') then 2
  else 3
end;
