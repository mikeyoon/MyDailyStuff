// users
package mydailystuff

type User struct {
}

func (*User) Construct(args ...interface{}) interface{} {
	this := &User{}

	return this
}

func (this *User) FindUserByLogin(email string, password string) {

}
