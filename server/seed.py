# server/seed.py

from app import create_app
from extensions import db, bcrypt
from models import User, Skill, Swap

app = create_app()

with app.app_context():
    print("Resetting DB...")
    db.drop_all()
    db.create_all()

    print("Seeding users...")
    user1 = User(
        username='denzel',
        email='denzel@email.com',
        password_hash=bcrypt.generate_password_hash('123456').decode('utf-8')
    )
    user2 = User(
        username='natasha',
        email='natasha@email.com',
        password_hash=bcrypt.generate_password_hash('abcdef').decode('utf-8')
    )
    user3 = User(
        username='edwin',
        email='edwin@email.com',
        password_hash=bcrypt.generate_password_hash('qwerty').decode('utf-8')
    )

    db.session.add_all([user1, user2, user3])
    db.session.commit()

    print("Seeding skills...")
    skill1 = Skill(name='Guitar Lessons', description='Acoustic and electric basics', user_id=user1.id)
    skill2 = Skill(name='Graphic Design', description='Photoshop and Illustrator', user_id=user2.id)
    skill3 = Skill(name='Cooking', description='Swahili dishes and street food', user_id=user3.id)
    skill4 = Skill(name='Coding Help', description='Learn Flask and React', user_id=user1.id)

    db.session.add_all([skill1, skill2, skill3, skill4])
    db.session.commit()

    print("Seeding swaps...")
    swap1 = Swap(
        sender_id=user1.id,
        receiver_id=user2.id,
        skill_id=skill2.id,
        message="Hi Natasha, I can teach guitar if you help me with design!",
        status='pending'
    )
    swap2 = Swap(
        sender_id=user3.id,
        receiver_id=user1.id,
        skill_id=skill4.id,
        message="Help me learn Flask and I’ll cook for you every Saturday 😅",
        status='accepted'
    )

    db.session.add_all([swap1, swap2])
    db.session.commit()
    print("Done.")
