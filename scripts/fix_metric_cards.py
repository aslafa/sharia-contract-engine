with open('src/app/(dashboard)/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace description= with subValue=
fixed = content.replace('description="', 'subValue="')

with open('src/app/(dashboard)/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(fixed)

print('Updated subValue props successfully!')
